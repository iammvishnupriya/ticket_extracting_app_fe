import axios from 'axios';
import type { Ticket, ApiError } from '../types/ticket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      const response = await apiClient.post('/api/tickets', ticket);
      return response.data;
    } catch (error) {
      console.error('Error saving ticket:', error);
      throw error;
    }
  },

  /**
   * Update an existing ticket
   */
  async updateTicket(id: number, ticket: Partial<Ticket>): Promise<Ticket> {
    try {
      const response = await apiClient.put(`/api/tickets/${id}`, ticket);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  /**
   * Get all tickets
   */
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const response = await apiClient.get('/api/tickets');
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
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
};

export default ticketService;