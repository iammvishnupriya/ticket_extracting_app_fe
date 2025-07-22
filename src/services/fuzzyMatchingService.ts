import axios from 'axios';

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
    console.log('Fuzzy Matching API Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Fuzzy Matching API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('Fuzzy Matching API Response:', response);
    return response;
  },
  (error) => {
    console.error('Fuzzy Matching API Response Error:', error);
    return Promise.reject(error);
  }
);

export interface ProjectMatchingRequest {
  content: string;
}

export interface ProjectMatchingResponse {
  originalContent: string;
  detectedProject: string;
  confidence: number;
  matchedKeywords: string[];
  suggestions: string[];
}

export interface SimilarityRequest {
  string1: string;
  string2: string;
}

export interface SimilarityResponse {
  string1: string;
  string2: string;
  similarity: number;
  distance: number;
  threshold: number;
  isMatch: boolean;
}

export interface FuzzyMatchingExample {
  category: string;
  original: string;
  variations: string[];
  description: string;
}

export const fuzzyMatchingService = {
  /**
   * Test project matching with typos and variations
   */
  async testProjectMatching(content: string): Promise<ProjectMatchingResponse> {
    try {
      const response = await apiClient.post('/api/fuzzy-test/project-matching', {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error testing project matching:', error);
      throw error;
    }
  },

  /**
   * Test similarity between two strings
   */
  async testSimilarity(string1: string, string2: string): Promise<SimilarityResponse> {
    try {
      const response = await apiClient.post('/api/fuzzy-test/similarity', {
        string1,
        string2
      });
      return response.data;
    } catch (error) {
      console.error('Error testing similarity:', error);
      throw error;
    }
  },

  /**
   * Get examples of fuzzy matching variations
   */
  async getExamples(): Promise<FuzzyMatchingExample[]> {
    try {
      const response = await apiClient.get('/api/fuzzy-test/examples');
      return response.data;
    } catch (error) {
      console.error('Error fetching fuzzy matching examples:', error);
      throw error;
    }
  },

  /**
   * Test the fuzzy matching system with a batch of test cases
   */
  async runBatchTest(testCases: ProjectMatchingRequest[]): Promise<ProjectMatchingResponse[]> {
    try {
      const promises = testCases.map(testCase => 
        this.testProjectMatching(testCase.content)
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error running batch test:', error);
      throw error;
    }
  }
};

export default fuzzyMatchingService;