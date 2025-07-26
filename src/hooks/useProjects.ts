import { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { FALLBACK_PROJECT_NAMES } from '../constants/projects';

interface UseProjectsReturn {
  projects: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isUsingFallback: boolean;
}

/**
 * Custom hook to fetch and manage project names from the backend
 * Falls back to predefined project names if backend fetch fails
 */
export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<string[]>([...FALLBACK_PROJECT_NAMES]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectNames = await ticketService.getProjectNames();
      setProjects(projectNames);
      setIsUsingFallback(false);
      console.log('✅ Successfully fetched projects from backend:', projectNames.length);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch project names';
      setError(errorMessage);
      console.warn('⚠️ Failed to fetch projects from backend, using fallback:', errorMessage);
      
      // Use fallback projects when backend fails
      setProjects([...FALLBACK_PROJECT_NAMES]);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Log fallback usage for debugging
  useEffect(() => {
    if (!isLoading && isUsingFallback) {
      console.warn('🔄 Using fallback project names. Backend may not have /api/projects endpoint implemented.');
    }
  }, [isLoading, isUsingFallback]);

  return {
    projects,
    isLoading,
    error,
    refetch,
    isUsingFallback
  };
};