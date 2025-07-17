import { useState, useCallback, useEffect } from 'react';
import type { Ticket, ApiError } from '../types/ticket';
import { ticketService } from '../services/ticketService';
import { validateTicket } from '../utils/validation';
import type { TicketValidationErrors } from '../utils/validation';
import toast from 'react-hot-toast';

export interface UseTicketReturn {
  // State
  currentTicket: Ticket | null;
  allTickets: Ticket[];
  isLoading: boolean;
  isProcessing: boolean;
  isSaving: boolean;
  error: string | null;
  validationErrors: TicketValidationErrors | null;

  // Actions
  processEmailText: (emailText: string) => Promise<void>;
  saveTicket: (ticket: Ticket) => Promise<void>;
  updateTicket: (id: number, ticket: Partial<Ticket>) => Promise<void>;
  loadAllTickets: () => Promise<void>;
  loadTicketById: (id: number) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  setCurrentTicket: (ticket: Ticket | null) => void;
  clearCurrentTicket: () => void;
  clearError: () => void;
  validateCurrentTicket: () => boolean;
  resetSavingState: () => void;
  resetState: () => void;
}

export const useTicket = (): UseTicketReturn => {
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<TicketValidationErrors | null>(null);

  // Debug: Monitor isSaving state changes
  useEffect(() => {
    console.log('isSaving state changed:', isSaving);
  }, [isSaving]);

  const handleError = useCallback((error: any) => {
    console.error('Ticket hook error:', error);
    
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as ApiError;
      setError(apiError.message);
      toast.error(apiError.message);
    } else if (typeof error === 'string') {
      setError(error);
      toast.error(error);
    } else {
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    }
  }, []);

  const processEmailText = useCallback(async (emailText: string) => {
    if (!emailText.trim()) {
      setError('Email text cannot be empty');
      toast.error('Email text cannot be empty');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setValidationErrors(null);

    try {
      console.log('Processing email text...');
      const ticket = await ticketService.processEmailText(emailText);
      console.log('Email processed successfully:', ticket);
      setCurrentTicket(ticket);
      toast.success('Email processed successfully!');
    } catch (error) {
      console.error('Error processing email:', error);
      handleError(error);
      setCurrentTicket(null);
    } finally {
      setIsProcessing(false);
    }
  }, [handleError]);

  const saveTicket = useCallback(async (ticket: Ticket) => {
    console.log('Saving ticket:', ticket);
    
    const validation = validateTicket(ticket);
    
    if (!validation.success) {
      console.log('Validation errors:', validation.errors);
      setValidationErrors(validation.errors || null);
      toast.error('Please fix validation errors before saving');
      setIsSaving(false); // Reset saving state on validation failure
      return;
    }

    console.log('saveTicket - setting isSaving to true');
    setIsSaving(true);
    setError(null);
    setValidationErrors(null);

    try {
      const savedTicket = await ticketService.saveTicket(ticket);
      setCurrentTicket(savedTicket);
      
      // Update allTickets if it exists
      setAllTickets(prev => {
        const existingIndex = prev.findIndex(t => t.id === savedTicket.id);
        if (existingIndex >= 0) {
          return prev.map((t, index) => index === existingIndex ? savedTicket : t);
        }
        return [...prev, savedTicket];
      });
      
      toast.success('Ticket saved successfully!');
    } catch (error) {
      handleError(error);
    } finally {
      console.log('saveTicket - finally block: setting isSaving to false');
      setIsSaving(false);
    }
  }, [handleError]);

  const updateTicket = useCallback(async (id: number, ticket: Partial<Ticket>) => {
    console.log('Updating ticket:', id, ticket);
    
    const validation = validateTicket(ticket);
    
    if (!validation.success) {
      console.log('Validation errors:', validation.errors);
      setValidationErrors(validation.errors || null);
      toast.error('Please fix validation errors before updating');
      setIsSaving(false); // Reset saving state on validation failure
      return;
    }

    console.log('updateTicket - setting isSaving to true');
    setIsSaving(true);
    setError(null);
    setValidationErrors(null);

    try {
      const updatedTicket = await ticketService.updateTicket(id, ticket);
      setCurrentTicket(updatedTicket);
      
      // Update allTickets
      setAllTickets(prev => 
        prev.map(t => t.id === id ? updatedTicket : t)
      );
      
      toast.success('Ticket updated successfully!');
    } catch (error) {
      handleError(error);
    } finally {
      console.log('updateTicket - finally block: setting isSaving to false');
      setIsSaving(false);
    }
  }, [handleError]);

  const loadAllTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tickets = await ticketService.getAllTickets();
      setAllTickets(tickets);
    } catch (error) {
      handleError(error);
      setAllTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const loadTicketById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const ticket = await ticketService.getTicketById(id);
      setCurrentTicket(ticket);
    } catch (error) {
      handleError(error);
      setCurrentTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteTicket = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await ticketService.deleteTicket(id);
      
      // Remove from allTickets
      setAllTickets(prev => prev.filter(t => t.id !== id));
      
      // Clear current ticket if it's the one being deleted
      if (currentTicket?.id === id) {
        setCurrentTicket(null);
      }
      
      toast.success('Ticket deleted successfully!');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, currentTicket]);

  const setCurrentTicketHandler = useCallback((ticket: Ticket | null) => {
    setCurrentTicket(ticket);
    setValidationErrors(null);
  }, []);

  const clearCurrentTicket = useCallback(() => {
    setCurrentTicket(null);
    setValidationErrors(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors(null);
  }, []);

  const resetSavingState = useCallback(() => {
    console.log('resetSavingState called - setting isSaving to false');
    setIsSaving(false);
  }, []);

  const validateCurrentTicket = useCallback(() => {
    if (!currentTicket) return false;
    
    const validation = validateTicket(currentTicket);
    setValidationErrors(validation.errors || null);
    
    return validation.success;
  }, [currentTicket]);

  const resetState = useCallback(() => {
    setCurrentTicket(null);
    setAllTickets([]);
    setIsLoading(false);
    setIsProcessing(false);
    setIsSaving(false);
    setError(null);
    setValidationErrors(null);
  }, []);

  return {
    // State
    currentTicket,
    allTickets,
    isLoading,
    isProcessing,
    isSaving,
    error,
    validationErrors,

    // Actions
    processEmailText,
    saveTicket,
    updateTicket,
    loadAllTickets,
    loadTicketById,
    deleteTicket,
    setCurrentTicket: setCurrentTicketHandler,
    clearCurrentTicket,
    clearError,
    validateCurrentTicket,
    resetSavingState,
    resetState,
  };
};