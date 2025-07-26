import { useState, useEffect, useCallback } from 'react';
import { contributorService } from '../services/contributorService';
import type { Contributor, ContributorOption } from '../types/contributor';

export const useContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [activeContributors, setActiveContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContributors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contributorService.getAllContributors();
      setContributors(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load contributors';
      setError(errorMessage);
      console.error('Error loading contributors:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveContributors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contributorService.getActiveContributors();
      setActiveContributors(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load active contributors';
      setError(errorMessage);
      console.error('Error loading active contributors:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert contributors to options for dropdowns
  const getContributorOptions = useCallback((contributorsList: Contributor[] = activeContributors): ContributorOption[] => {
    return contributorsList.map(contributor => ({
      value: contributor.id,
      label: contributor.name,
      email: contributor.email,
      department: contributor.department,
      active: contributor.active,
    }));
  }, [activeContributors]);

  // Find contributor by ID
  const findContributorById = useCallback((id: number): Contributor | undefined => {
    return contributors.find(contributor => contributor.id === id);
  }, [contributors]);

  // Find contributor by name (for backward compatibility)
  const findContributorByName = useCallback((name: string): Contributor | undefined => {
    // First try to find in active contributors for better performance
    let found = activeContributors.find(contributor => 
      contributor.name.toLowerCase() === name.toLowerCase()
    );
    
    // If not found in active, try all contributors if they're loaded
    if (!found && contributors.length > 0) {
      found = contributors.find(contributor => 
        contributor.name.toLowerCase() === name.toLowerCase()
      );
    }
    
    return found;
  }, [activeContributors, contributors]);

  // Refresh contributors data
  const refresh = useCallback(async () => {
    await Promise.all([loadContributors(), loadActiveContributors()]);
  }, [loadContributors, loadActiveContributors]);

  // Load data on mount - only load active contributors initially for better performance
  useEffect(() => {
    loadActiveContributors();
  }, [loadActiveContributors]);

  return {
    contributors,
    activeContributors,
    isLoading,
    error,
    loadContributors,
    loadActiveContributors,
    getContributorOptions,
    findContributorById,
    findContributorByName,
    refresh,
  };
};