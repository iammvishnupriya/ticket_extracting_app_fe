import axios from 'axios';
import type { Contributor, ContributorRequest } from '../types/contributor';
import type { ApiError } from '../types/ticket';

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
    console.log('Contributors API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Contributors API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('Contributors API Response:', response);
    return response;
  },
  (error) => {
    console.error('Contributors API Response Error:', error);
    
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

export const contributorService = {
  /**
   * Get all contributors
   */
  async getAllContributors(): Promise<Contributor[]> {
    try {
      const response = await apiClient.get('/api/contributors');
      return response.data;
    } catch (error) {
      console.error('Error fetching all contributors:', error);
      throw error;
    }
  },

  /**
   * Get active contributors only (for dropdowns)
   */
  async getActiveContributors(): Promise<Contributor[]> {
    try {
      const response = await apiClient.get('/api/contributors/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active contributors:', error);
      throw error;
    }
  },

  /**
   * Get contributor by ID
   */
  async getContributorById(id: number): Promise<Contributor> {
    try {
      const response = await apiClient.get(`/api/contributors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contributor by ID:', error);
      throw error;
    }
  },

  /**
   * Create new contributor
   */
  async createContributor(contributor: ContributorRequest): Promise<Contributor> {
    try {
      const response = await apiClient.post('/api/contributors', contributor);
      return response.data;
    } catch (error) {
      console.error('Error creating contributor:', error);
      throw error;
    }
  },

  /**
   * Update contributor
   */
  async updateContributor(id: number, contributor: ContributorRequest): Promise<Contributor> {
    try {
      const response = await apiClient.put(`/api/contributors/${id}`, contributor);
      return response.data;
    } catch (error) {
      console.error('Error updating contributor:', error);
      throw error;
    }
  },

  /**
   * Delete contributor (soft delete - sets active = false)
   */
  async deleteContributor(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/contributors/${id}`);
    } catch (error) {
      console.error('Error deleting contributor:', error);
      throw error;
    }
  },

  /**
   * Activate contributor
   */
  async activateContributor(id: number): Promise<Contributor> {
    try {
      const response = await apiClient.put(`/api/contributors/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error('Error activating contributor:', error);
      throw error;
    }
  },

  /**
   * Deactivate contributor
   */
  async deactivateContributor(id: number): Promise<Contributor> {
    try {
      const response = await apiClient.put(`/api/contributors/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating contributor:', error);
      throw error;
    }
  },

  /**
   * Search contributors by name
   */
  async searchContributorsByName(searchTerm: string): Promise<Contributor[]> {
    try {
      const response = await apiClient.get(`/api/contributors/search?name=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching contributors by name:', error);
      throw error;
    }
  },

  /**
   * Get contributors by department
   */
  async getContributorsByDepartment(departmentName: string): Promise<Contributor[]> {
    try {
      const response = await apiClient.get(`/api/contributors/department/${encodeURIComponent(departmentName)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contributors by department:', error);
      throw error;
    }
  },

  /**
   * Check if email exists (for validation)
   */
  async checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      const url = excludeId 
        ? `/api/contributors/check-email?email=${encodeURIComponent(email)}&excludeId=${excludeId}`
        : `/api/contributors/check-email?email=${encodeURIComponent(email)}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  },

  /**
   * Check if employee ID exists (for validation)
   */
  async checkEmployeeIdExists(employeeId: string, excludeId?: number): Promise<boolean> {
    try {
      const url = excludeId 
        ? `/api/contributors/check-employee-id?employeeId=${encodeURIComponent(employeeId)}&excludeId=${excludeId}`
        : `/api/contributors/check-employee-id?employeeId=${encodeURIComponent(employeeId)}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error checking employee ID existence:', error);
      throw error;
    }
  },

  /**
   * Permanently delete contributor (hard delete)
   */
  async permanentlyDeleteContributor(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/contributors/${id}/permanent`);
    } catch (error) {
      console.error('Error permanently deleting contributor:', error);
      throw error;
    }
  },

  /**
   * Advanced search contributors with multiple criteria
   */
  async searchContributors(params: {
    name?: string;
    email?: string;
    department?: string;
    employeeId?: string;
    active?: boolean;
  }): Promise<Contributor[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.name) searchParams.append('name', params.name);
      if (params.email) searchParams.append('email', params.email);
      if (params.department) searchParams.append('department', params.department);
      if (params.employeeId) searchParams.append('employeeId', params.employeeId);
      if (params.active !== undefined) searchParams.append('active', params.active.toString());

      const response = await apiClient.get(`/api/contributors/search?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching contributors:', error);
      throw error;
    }
  },

  /**
   * Get all departments with contributor counts
   */
  async getDepartmentStats(): Promise<{ department: string; count: number; activeCount: number }[]> {
    try {
      // Since this endpoint might not exist, calculate stats from existing data
      const contributors = await this.getAllContributors();
      const statsMap = new Map<string, { count: number; activeCount: number }>();
      
      contributors.forEach(contributor => {
        const dept = contributor.department || 'Unknown';
        if (!statsMap.has(dept)) {
          statsMap.set(dept, { count: 0, activeCount: 0 });
        }
        const stats = statsMap.get(dept)!;
        stats.count++;
        if (contributor.active) {
          stats.activeCount++;
        }
      });
      
      return Array.from(statsMap.entries()).map(([department, stats]) => ({
        department,
        count: stats.count,
        activeCount: stats.activeCount
      }));
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  },

  /**
   * Bulk operations - simulate using individual API calls
   */
  async bulkActivateContributors(ids: number[]): Promise<void> {
    try {
      const promises = ids.map(id => this.activateContributor(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk activating contributors:', error);
      throw error;
    }
  },

  async bulkDeactivateContributors(ids: number[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deactivateContributor(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk deactivating contributors:', error);
      throw error;
    }
  },

  async bulkDeleteContributors(ids: number[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteContributor(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk deleting contributors:', error);
      throw error;
    }
  },

  /**
   * Export contributors to CSV
   */
  async exportContributors(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      // Since backend doesn't support export, create client-side export
      const contributors = await this.getAllContributors();
      let content = '';
      
      if (format === 'csv') {
        const headers = ['ID', 'Name', 'Email', 'Employee ID', 'Department', 'Phone', 'Active', 'Notes'];
        content = headers.join(',') + '\n';
        
        contributors.forEach(contributor => {
          const row = [
            contributor.id,
            `"${contributor.name}"`,
            `"${contributor.email}"`,
            `"${contributor.employeeId || ''}"`,
            `"${contributor.department || ''}"`,
            `"${contributor.phone || ''}"`,
            contributor.active,
            `"${contributor.notes || ''}"`
          ];
          content += row.join(',') + '\n';
        });
      } else {
        content = JSON.stringify(contributors, null, 2);
      }
      
      return new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    } catch (error) {
      console.error('Error exporting contributors:', error);
      throw error;
    }
  },

  /**
   * Import contributors from CSV
   */
  async importContributors(file: File): Promise<{ success: number; errors: string[] }> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            // Skip header line
            lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            let success = 0;
            const errors: string[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              
              try {
                const contributor = {
                  name: values[1] || '',
                  email: values[2] || '',
                  employeeId: values[3] || undefined,
                  department: values[4] || undefined,
                  phone: values[5] || undefined,
                  active: values[6] === 'true',
                  notes: values[7] || undefined,
                };
                
                await this.createContributor(contributor);
                success++;
              } catch (error: any) {
                errors.push(`Line ${i + 1}: ${error.message}`);
              }
            }
            
            resolve({ success, errors });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error importing contributors:', error);
      throw error;
    }
  },
};

export default contributorService;