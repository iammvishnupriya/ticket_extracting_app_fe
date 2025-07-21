import axios from 'axios';
import type { Ticket, ApiError } from '../types/ticket';
import type { ConsolidateResponse } from '../types/consolidate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
      message = 'Unable to connect to the backend server. Please ensure the Spring Boot application is running on port 8080.';
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
      
      // Handle contributor field - backend might expect it to be null
      if (ticket.contributor !== undefined) {
        if (typeof ticket.contributor === 'string') {
          // If it's a string (like an email), set to null and let backend handle via contributorId
          ticketData.contributor = null;
        } else if (ticket.contributor && typeof ticket.contributor === 'object') {
          // If it's an object, extract the ID and set contributor to null
          if (ticket.contributor.id) {
            ticketData.contributorId = ticket.contributor.id;
          }
          ticketData.contributor = null;
        }
      }
      
      // Keep contributorId if it exists (backend will use this to link contributor)
      if (ticket.contributorId) {
        ticketData.contributorId = ticket.contributorId;
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
      // Transform the ticket data to match the new API expectations
      const ticketData: any = { ...ticket };
      
      // Ensure id is included in the request body
      ticketData.id = id;
      
      // Handle contributor field according to the new API specification
      if (ticket.contributor !== undefined) {
        if (typeof ticket.contributor === 'string') {
          // Option 3: Just contributor name (fallback)
          ticketData.contributorName = ticket.contributor;
          // Remove the contributor field as it's not expected in this format
          delete ticketData.contributor;
        } else if (ticket.contributor && typeof ticket.contributor === 'object') {
          // Option 1: Full contributor object
          ticketData.contributor = {
            id: ticket.contributor.id,
            name: ticket.contributor.name,
            email: ticket.contributor.email,
            employeeId: ticket.contributor.employeeId,
            department: ticket.contributor.department,
            phone: ticket.contributor.phone,
            active: ticket.contributor.active,
            notes: ticket.contributor.notes
          };
          // Also set contributorId for Option 2
          if (ticket.contributor.id) {
            ticketData.contributorId = ticket.contributor.id;
          }
        }
      }
      
      // Option 2: Just contributor ID (most common) - if contributorId exists but no contributor object
      if (ticket.contributorId && !ticketData.contributor) {
        ticketData.contributorId = ticket.contributorId;
      }
      
      // Debug: log what we're sending
      console.log('Sending edit-json update data:', {
        id,
        endpoint: `/api/tickets/${id}/edit-json`,
        contributor: ticketData.contributor,
        contributorId: ticketData.contributorId,
        contributorName: ticketData.contributorName,
        originalContributor: ticket.contributor,
        fullTicketData: ticketData
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