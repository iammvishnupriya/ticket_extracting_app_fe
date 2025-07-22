import { useState, useCallback } from 'react';
import { fuzzyMatchingService } from '../services/fuzzyMatchingService';
import type { 
  ProjectMatchingResponse, 
  SimilarityResponse, 
  FuzzyMatchingExample 
} from '../services/fuzzyMatchingService';
import toast from 'react-hot-toast';

export interface UseFuzzyMatchingReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Project matching
  projectResult: ProjectMatchingResponse | null;
  testProjectMatching: (content: string) => Promise<ProjectMatchingResponse | null>;
  
  // Similarity testing
  similarityResult: SimilarityResponse | null;
  testSimilarity: (string1: string, string2: string) => Promise<SimilarityResponse | null>;
  
  // Examples
  examples: FuzzyMatchingExample[];
  loadExamples: () => Promise<void>;
  
  // Batch testing
  batchResults: ProjectMatchingResponse[];
  runBatchTest: (testCases: string[]) => Promise<ProjectMatchingResponse[]>;
  
  // Utilities
  clearError: () => void;
  clearResults: () => void;
}

export const useFuzzyMatching = (): UseFuzzyMatchingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectResult, setProjectResult] = useState<ProjectMatchingResponse | null>(null);
  const [similarityResult, setSimilarityResult] = useState<SimilarityResponse | null>(null);
  const [examples, setExamples] = useState<FuzzyMatchingExample[]>([]);
  const [batchResults, setBatchResults] = useState<ProjectMatchingResponse[]>([]);

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Fuzzy matching error in ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }
    
    setError(message);
    toast.error(`${context}: ${message}`);
  }, []);

  const testProjectMatching = useCallback(async (content: string): Promise<ProjectMatchingResponse | null> => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      toast.error('Content cannot be empty');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fuzzyMatchingService.testProjectMatching(content);
      setProjectResult(result);
      toast.success('Project matching test completed');
      return result;
    } catch (error) {
      handleError(error, 'Project matching test');
      setProjectResult(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const testSimilarity = useCallback(async (string1: string, string2: string): Promise<SimilarityResponse | null> => {
    if (!string1.trim() || !string2.trim()) {
      setError('Both strings must be provided');
      toast.error('Both strings must be provided');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fuzzyMatchingService.testSimilarity(string1, string2);
      setSimilarityResult(result);
      toast.success('Similarity test completed');
      return result;
    } catch (error) {
      handleError(error, 'Similarity test');
      setSimilarityResult(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const loadExamples = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const exampleData = await fuzzyMatchingService.getExamples();
      setExamples(exampleData);
      toast.success('Examples loaded successfully');
    } catch (error) {
      handleError(error, 'Loading examples');
      setExamples([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const runBatchTest = useCallback(async (testCases: string[]): Promise<ProjectMatchingResponse[]> => {
    if (testCases.length === 0) {
      setError('No test cases provided');
      toast.error('No test cases provided');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const testRequests = testCases.map(content => ({ content }));
      const results = await fuzzyMatchingService.runBatchTest(testRequests);
      setBatchResults(results);
      toast.success(`Batch test completed for ${results.length} cases`);
      return results;
    } catch (error) {
      handleError(error, 'Batch test');
      setBatchResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setProjectResult(null);
    setSimilarityResult(null);
    setBatchResults([]);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Project matching
    projectResult,
    testProjectMatching,
    
    // Similarity testing
    similarityResult,
    testSimilarity,
    
    // Examples
    examples,
    loadExamples,
    
    // Batch testing
    batchResults,
    runBatchTest,
    
    // Utilities
    clearError,
    clearResults,
  };
};