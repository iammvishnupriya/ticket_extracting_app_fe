import axios from 'axios';
import type { Ticket, ApiError } from '../types/ticket';
import type { ConsolidateResponse } from '../types/consolidate';

// Use relative URL in development to work with Vite proxy, full URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5143');

// Retry utility for handling network issues
const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on specific network errors
      if (error.code === 'ERR_INCOMPLETE_CHUNKED_ENCODING' || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNREFUSED') {
        console.log(`Request failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Handle chunked responses better
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    let message = 'An unexpected error occurred';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      message = 'Unable to connect to the backend server. Please ensure the Spring Boot application is running on port 5143.';
    } else if (error.code === 'ERR_INCOMPLETE_CHUNKED_ENCODING') {
      message = 'Response from server was incomplete. This may be due to a large dataset or server timeout.';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    const apiError: ApiError = {
      message,
      status: error.response?.status || 500,
      details: error.response?.data,
    };
    
    return Promise.reject(apiError);
  }
);

export const ticketService = {
  /**
   * Process email text to extract ticket information
   */
  async processEmailText(emailText: string): Promise<Ticket> {
    try {
      const response = await apiClient.post('/api/emails/process-text', emailText, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing email text:', error);
      throw error;
    }
  },

  /**
   * Save or update a ticket
   */
  async saveTicket(ticket: Ticket): Promise<Ticket> {
    try {
      // Transform the ticket data to match backend expectations
      const ticketData = { ...ticket };
      
      // Handle multiple contributors (new format)
      if (ticket.contributors && Array.isArray(ticket.contributors) && ticket.contributors.length > 0) {
        // Send contributors array to backend
        ticketData.contributors = ticket.contributors;
        ticketData.contributorIds = ticket.contributorIds || [];
        ticketData.contributorNames = ticket.contributorNames || [];
        
        // For backward compatibility, set first contributor as primary
        const firstContributor = ticket.contributors[0];
        if (typeof firstContributor === 'string') {
          ticketData.contributor = firstContributor;
          ticketData.contributorName = firstContributor;
        } else if (firstContributor && typeof firstContributor === 'object') {
          ticketData.contributor = firstContributor;
          ticketData.contributorId = firstContributor.id;
          ticketData.contributorName = firstContributor.name;
        }
      } else {
        // Handle legacy single contributor field
        if (ticket.contributor !== undefined) {
          if (typeof ticket.contributor === 'string') {
            ticketData.contributor = ticket.contributor;
            ticketData.contributorName = ticket.contributor;
          } else if (ticket.contributor && typeof ticket.contributor === 'object') {
            if (ticket.contributor.id) {
              ticketData.contributorId = ticket.contributor.id;
            }
            ticketData.contributor = ticket.contributor;
          }
        }
        
        // Keep contributorId if it exists (backend will use this to link contributor)
        if (ticket.contributorId) {
          ticketData.contributorId = ticket.contributorId;
        }
      }
      
      const response = await apiClient.post('/api/tickets', ticketData);
      return response.data;
    } catch (error) {
      console.error('Error saving ticket:', error);
      throw error;
    }
  },

  /**
   * Update an existing ticket using the edit-json endpoint
   */
  async updateTicket(id: number, ticket: Partial<Ticket>): Promise<Ticket> {
    try {
      // Transform the ticket data to match the backend expectations
      const ticketData: any = { ...ticket };
      
      // Ensure id is included in the request body
      ticketData.id = id;
      
      // Handle contributors with the new backend structure
      if (ticket.contributors && Array.isArray(ticket.contributors) && ticket.contributors.length > 0) {
        // Process multiple contributors for the new backend format
        const contributorIds: number[] = [];
        
        ticket.contributors.forEach(contributor => {
          if (contributor && typeof contributor === 'object' && contributor.id) {
            contributorIds.push(contributor.id);
          }
        });
        
        // Use the new contributorIdsList field (recommended by backend)
        if (contributorIds.length > 0) {
          ticketData.contributorIdsList = contributorIds;
          // Also send the string format for backward compatibility
          ticketData.contributorIds = contributorIds.join(',');
        }
        
        // For backward compatibility, set first contributor as primary
        const firstContributor = ticket.contributors[0];
        if (firstContributor && typeof firstContributor === 'object') {
          if (firstContributor.id) {
            ticketData.contributorId = firstContributor.id;
          }
          if (firstContributor.name) {
            ticketData.contributorName = firstContributor.name;
          }
        }
        
        // Remove the contributors array to avoid backend issues
        delete ticketData.contributors;
        delete ticketData.contributor;
      } else if (ticket.contributor) {
        // Handle legacy single contributor field
        if (typeof ticket.contributor === 'string') {
          ticketData.contributorName = ticket.contributor;
          delete ticketData.contributor;
        } else if (ticket.contributor && typeof ticket.contributor === 'object') {
          if (ticket.contributor.id) {
            ticketData.contributorId = ticket.contributor.id;
          }
          if (ticket.contributor.name) {
            ticketData.contributorName = ticket.contributor.name;
          }
          delete ticketData.contributor;
        }
      } else {
        // Clean up any leftover contributor fields
        delete ticketData.contributors;
        delete ticketData.contributor;
        delete ticketData.contributorIds;
        delete ticketData.contributorNames;
      }
      
      // Ensure all string fields are properly handled
      const stringFields = [
        'ticketSummary', 'project', 'issueDescription', 'receivedDate', 
        'priority', 'ticketOwner', 'bugType', 'status', 'review', 
        'impact', 'contact', 'employeeId', 'employeeName', 'messageId',
        'contributorName'
      ];
      
      stringFields.forEach(field => {
        if (ticketData[field] !== undefined && ticketData[field] !== null) {
          // Ensure it's a string
          if (Array.isArray(ticketData[field])) {
            // If it's an array, take the first element or convert to empty string
            ticketData[field] = ticketData[field].length > 0 ? String(ticketData[field][0]) : '';
          } else {
            ticketData[field] = String(ticketData[field]);
          }
        }
      });
      
      // Debug: log what we're sending
      console.log('Sending edit-json update data:', {
        id,
        endpoint: `/api/tickets/${id}/edit-json`,
        contributorId: ticketData.contributorId,
        contributorName: ticketData.contributorName,
        contributorIds: ticketData.contributorIds,
        contributorNames: ticketData.contributorNames,
        originalContributors: ticket.contributors,
        cleanedData: ticketData
      });
      
      // Use the correct edit-json endpoint
      const response = await apiClient.put(`/api/tickets/${id}/edit-json`, ticketData);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket with edit-json endpoint:', error);
      throw error;
    }
  },

  /**
   * Get all tickets
   */
  async getAllTickets(): Promise<Ticket[]> {
    try {
      return await retryRequest(async () => {
        const response = await apiClient.get('/api/tickets', {
          timeout: 60000, // Increase timeout to 60 seconds
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // Ensure we have valid data
        if (!response.data) {
          console.warn('No data received from getAllTickets');
          return [];
        }
        
        // Ensure it's an array
        if (!Array.isArray(response.data)) {
          console.error('Expected array but got:', typeof response.data);
          return [];
        }
        
        return response.data;
      }, 3, 1000);
    } catch (error) {
      console.error('Error fetching tickets after retries:', error);
      throw error;
    }
  },

  /**
   * Get a specific ticket by ID
   */
  async getTicketById(id: number): Promise<Ticket> {
    try {
      const response = await apiClient.get(`/api/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  /**
   * Delete a ticket
   */
  async deleteTicket(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/tickets/${id}`);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  /**
   * Check if the backend is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  /**
   * Get consolidation data (bug tracking summary by project)
   */
  async getConsolidateData(): Promise<ConsolidateResponse[]> {
    try {
      const response = await apiClient.get('/api/consolidate');
      return response.data;
    } catch (error) {
      console.error('Error fetching consolidate data:', error);
      throw error;
    }
  },

  /**
   * Get all project names from the backend
   * First tries /api/projects endpoint, then falls back to extracting from tickets
   */
  async getProjectNames(): Promise<string[]> {
    try {
      // First try dedicated projects endpoint
      console.log('🔍 Fetching projects from /api/projects...');
      const response = await apiClient.get('/api/projects');
      
      if (response.data && Array.isArray(response.data)) {
        console.log('✅ Successfully fetched projects from dedicated endpoint:', response.data.length);
        return response.data.filter(project => project && typeof project === 'string' && project.trim().length > 0);
      } else {
        throw new Error('Invalid response format from /api/projects');
      }
    } catch (error: any) {
      console.warn('⚠️ Dedicated projects endpoint failed:', error?.response?.status === 404 ? 'Endpoint not found' : error?.message);
      
      // Fallback: extract project names from existing tickets
      try {
        console.log('🔄 Falling back to extracting projects from tickets...');
        const tickets = await this.getAllTickets();
        const projectNames = Array.from(new Set(
          tickets
            .map(ticket => ticket.project)
            .filter(project => project && project.trim().length > 0)
        )).sort();
        
        console.log('✅ Extracted projects from tickets:', projectNames.length);
        return projectNames;
      } catch (ticketError) {
        console.error('❌ Failed to extract projects from tickets:', ticketError);
        throw new Error('Unable to fetch projects from backend or tickets');
      }
    }
  },

  /**
   * Assign contributor to ticket by ID
   */
  async assignContributorToTicket(ticketId: number, contributorId: number): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${ticketId}/contributor/${contributorId}`);
      return response.data;
    } catch (error) {
      console.error('Error assigning contributor to ticket:', error);
      throw error;
    }
  },

  /**
   * Assign contributor to ticket by name (fallback)
   */
  async assignContributorToTicketByName(ticketId: number, contributorName: string): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${ticketId}/contributor?contributorName=${encodeURIComponent(contributorName)}`);
      return response.data;
    } catch (error) {
      console.error('Error assigning contributor to ticket by name:', error);
      throw error;
    }
  },

  /**
   * Remove contributor from ticket
   */
  async removeContributorFromTicket(ticketId: number): Promise<Ticket> {
    try {
      const response = await apiClient.delete(`/api/tickets/${ticketId}/contributor`);
      return response.data;
    } catch (error) {
      console.error('Error removing contributor from ticket:', error);
      throw error;
    }
  },

  /**
   * Get contributor for ticket
   */
  async getContributorForTicket(ticketId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/api/tickets/${ticketId}/contributor`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contributor for ticket:', error);
      throw error;
    }
  },

  /**
   * Migrate old contributor data (run once)
   */
  async migrateContributors(): Promise<void> {
    try {
      await apiClient.post('/api/tickets/migrate-contributors');
    } catch (error) {
      console.error('Error migrating contributors:', error);
      throw error;
    }
  },
};

export default ticketService;