import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Save, 
  X, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Tag, 
  Flag, 
  Settings, 
  Clock, 
  User, 
  Phone, 
  Target, 
  MessageSquare, 
  Hash,
  ArrowLeft 
} from 'lucide-react';
import { 
  PRIORITY_OPTIONS, 
  BUG_TYPE_OPTIONS, 
  STATUS_OPTIONS
} from '../types/ticket';
import type { 
  Ticket
} from '../types/ticket';
import { useProjects } from '../hooks/useProjects';

// Import contributor hook
import { useContributors } from '../hooks/useContributors';
import { MultiContributorField } from './MultiContributorField';

import { ticketValidationSchema } from '../utils/validation';
import { getCharacterCount, isCharacterLimitExceeded, generateMessageId, getContributorName } from '../utils/validation';
import toast from 'react-hot-toast';
import { z } from 'zod';

type TicketFormData = z.infer<typeof ticketValidationSchema>;

interface TicketEditorProps {
  ticket: Ticket;
  onSave: (ticket: Ticket) => Promise<void>;
  onCancel: () => void;
  onBack?: () => void;
  isSaving: boolean;
}

export const TicketEditor: React.FC<TicketEditorProps> = ({
  ticket,
  onSave,
  onCancel,
  onBack,
  isSaving,
}) => {
  // Defensive check for required props
  if (!ticket) {
    console.error('TicketEditor: ticket prop is required');
    return (
      <div className="card animate-slide-up">
        <div className="card-body">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Error: No ticket data provided</p>
            <button onClick={onCancel} className="btn-secondary mt-4">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use projects hook with error handling
  const { projects } = useProjects();
  
  // Convert project names to options for SelectField with safety check
  const PROJECT_OPTIONS = Array.isArray(projects) ? projects.map(project => ({
    value: project,
    label: project,
    color: '#6b7280' // Default gray color for projects
  })) : [];

  // Use contributors hook with error handling
  const { findContributorByName } = useContributors();
  // Create safe default values
  const createDefaultValues = (ticketData: Ticket) => {
    try {
      return {
        ticketSummary: ticketData?.ticketSummary || '',
        project: ticketData?.project || '',
        issueDescription: ticketData?.issueDescription || '',
        receivedDate: ticketData?.receivedDate || '',
        priority: ticketData?.priority || 'LOW',
        ticketOwner: ticketData?.ticketOwner || '',
        contributor: getContributorName(ticketData?.contributor) || '',
        contributors: (ticketData?.contributors && Array.isArray(ticketData.contributors)) ? ticketData.contributors : 
          (ticketData?.contributor ? [ticketData.contributor] : []),
        contributorIds: Array.isArray(ticketData?.contributorIds) ? ticketData.contributorIds : [],
        contributorNames: typeof ticketData?.contributorNames === 'string' ? ticketData.contributorNames : '',
        bugType: ticketData?.bugType || 'BUG',
        status: ticketData?.status || 'NEW',
        review: ticketData?.review || '',
        impact: ticketData?.impact || '',
        contact: ticketData?.contact || '',
        employeeId: ticketData?.employeeId || '',
        employeeName: ticketData?.employeeName || '',
        messageId: ticketData?.messageId || generateMessageId(),
      };
    } catch (error) {
      console.error('Error creating default values:', error);
      // Return minimal safe defaults
      return {
        ticketSummary: '',
        project: '',
        issueDescription: '',
        receivedDate: '',
        priority: 'LOW' as const,
        ticketOwner: '',
        contributor: '',
        contributors: [],
        contributorIds: [],
        contributorNames: '',
        bugType: 'BUG' as const,
        status: 'NEW' as const,
        review: '',
        impact: '',
        contact: '',
        employeeId: '',
        employeeName: '',
        messageId: generateMessageId(),
      };
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<any>({
    resolver: zodResolver(ticketValidationSchema),
    defaultValues: createDefaultValues(ticket),
    mode: 'onChange',
  });

  console.log('TicketEditor rendered with isSaving:', isSaving);
  console.log('Form validation state - isValid:', isValid, 'errors:', errors);
  
  // Debug: Log current form values to see what's being validated
  const currentValues = watch();
  console.log('Current form values:', currentValues);
  
  // Debug: Test manual validation
  useEffect(() => {
    if (currentValues && Object.keys(currentValues).length > 0) {
      const validationResult = ticketValidationSchema.safeParse(currentValues);
      console.log('Manual validation result:', validationResult);
      if (!validationResult.success) {
        console.log('Validation errors:', validationResult.error.issues);
      }
    }
  }, [currentValues]);

  // Reset form validation state when saving completes
  useEffect(() => {
    if (!isSaving) {
      console.log('TicketEditor - isSaving changed to false, clearing form errors');
      // Clear any form submission state that might be blocking the form
      setTimeout(() => {
        console.log('TicketEditor - Triggering form validation reset');
      }, 100);
    }
  }, [isSaving]);

  // Reset form when ticket changes
  useEffect(() => {
    try {
      console.log('TicketEditor - Resetting form with ticket:', ticket?.id, 'isSaving:', isSaving);
      
      if (!ticket) {
        console.warn('TicketEditor - No ticket provided for form reset');
        return;
      }

      const formData = createDefaultValues(ticket);
      
      reset(formData, { 
        keepErrors: false, 
        keepDirty: false, 
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false
      });
      
      // Force validation after reset to ensure isValid is correct
      setTimeout(() => {
        console.log('TicketEditor - Triggering validation after reset');
      }, 50);
      
      console.log('TicketEditor - Form reset completed');
    } catch (error) {
      console.error('TicketEditor - Error during form reset:', error);
    }
  }, [ticket, reset]);

  // Simple function to get character count for a field


  const handleFormSubmit = async (data: TicketFormData) => {
    try {
      console.log('TicketEditor - Submitting ticket data:', data);
      
      if (!ticket?.id) {
        throw new Error('Ticket ID is required for saving');
      }

      if (!data) {
        throw new Error('Form data is required for saving');
      }
      
      // Convert TicketFormData to Ticket and handle contributor fields properly
      const ticketData: Ticket = {
        ...data,
        id: ticket.id
      };

      // Process multiple contributors
      if (data.contributors && Array.isArray(data.contributors) && data.contributors.length > 0) {
        const contributorIds: number[] = [];
        const contributorNames: string[] = [];
        const processedContributors: (string | any)[] = [];

        data.contributors.forEach(contributor => {
          if (typeof contributor === 'string') {
            // Try to find contributor by name in database
            const foundContributor = findContributorByName(contributor);
            if (foundContributor) {
              contributorIds.push(foundContributor.id);
              contributorNames.push(foundContributor.name);
              processedContributors.push(foundContributor);
            } else {
              contributorNames.push(contributor);
              processedContributors.push(contributor);
            }
          } else if (contributor && typeof contributor === 'object' && contributor.id) {
            contributorIds.push(contributor.id);
            contributorNames.push(contributor.name);
            processedContributors.push(contributor);
          }
        });

        ticketData.contributors = processedContributors;
        ticketData.contributorIds = contributorIds;
        ticketData.contributorNames = contributorNames.join(', ');

        // For backward compatibility, set the first contributor as the primary one
        if (processedContributors.length > 0) {
          ticketData.contributor = processedContributors[0];
          if (contributorIds.length > 0) {
            ticketData.contributorId = contributorIds[0];
          }
          // Get first contributor name from the comma-separated string
          const firstContributorName = ticketData.contributorNames?.split(', ')[0];
          if (firstContributorName) {
            ticketData.contributorName = firstContributorName;
          }
        }
      } else {
        // Handle legacy single contributor field if no contributors array
        if (data.contributor) {
          if (typeof data.contributor === 'string') {
            const foundContributor = findContributorByName(data.contributor);
            if (foundContributor) {
              ticketData.contributor = foundContributor;
              ticketData.contributorId = foundContributor.id;
              ticketData.contributorName = foundContributor.name;
              // Also populate the new arrays for consistency
              ticketData.contributors = [foundContributor];
              ticketData.contributorIds = [foundContributor.id];
              ticketData.contributorNames = foundContributor.name;
            } else {
              ticketData.contributor = data.contributor;
              ticketData.contributorName = data.contributor;
              ticketData.contributors = [data.contributor as any]; // String contributor for backward compatibility
              ticketData.contributorNames = data.contributor;
              delete ticketData.contributorId;
            }
          }
        }
      }
      
      console.log('TicketEditor - Final ticket data being sent to onSave:', {
        id: ticketData.id,
        contributor: ticketData.contributor,
        contributors: ticketData.contributors,
        contributorId: ticketData.contributorId,
        contributorIds: ticketData.contributorIds,
        contributorName: ticketData.contributorName,
        contributorNames: ticketData.contributorNames,
        allFields: Object.keys(ticketData)
      });
      
      await onSave(ticketData);
      
      console.log('TicketEditor - onSave completed successfully');
    } catch (error) {
      console.error('TicketEditor - Error saving ticket:', error);
      toast.error('Failed to save ticket. Please try again.');
    }
  };

  const FormField = React.useCallback(({ 
    name, 
    label, 
    type = 'text', 
    placeholder, 
    maxLength, 
    required = false,
    icon,
    isTextarea = false,
    rows = 3
  }: {
    name: keyof TicketFormData;
    label: string;
    type?: string;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    icon?: React.ReactNode;
    isTextarea?: boolean;
    rows?: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Ensure field value is always a string
          const safeValue = field.value ?? '';
          const stringValue = String(safeValue);
          
          return (
            <div className="relative">
              {isTextarea ? (
                <textarea
                  {...field}
                  value={stringValue}
                  id={name}
                  rows={rows}
                  placeholder={placeholder}
                  className={`input-field resize-y scrollbar-thin ${
                    errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  } ${
                    maxLength && isCharacterLimitExceeded(stringValue, maxLength)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  disabled={isSaving}
                />
              ) : (
                <input
                  {...field}
                  value={stringValue}
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  className={`input-field ${
                    errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  } ${
                    maxLength && isCharacterLimitExceeded(stringValue, maxLength)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  disabled={isSaving}
                />
              )}
              
              {maxLength && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  <span className={isCharacterLimitExceeded(stringValue, maxLength) ? 'text-red-500' : ''}>
                    {getCharacterCount(stringValue, maxLength)}
                  </span>
                </div>
              )}
            </div>
          );
        }}
      />
      
      {errors[name] && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {String(errors[name]?.message || 'Invalid input')}
        </p>
      )}
    </div>
  ), [control, errors, isSaving]);

  const SelectField = React.useCallback(({ name, label, options, icon, required = false }: {
    name: keyof TicketFormData;
    label: string;
    options: { value: string; label: string; color: string }[];
    icon?: React.ReactNode;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            className={`input-field ${
              errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            disabled={isSaving}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      
      {errors[name] && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {String(errors[name]?.message || 'Invalid input')}
        </p>
      )}
    </div>
  ), [control, errors, isSaving]);



  return (
    <div className="card animate-slide-up hover-lift">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl shadow-lg glow-effect">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient">
                {ticket.id ? 'Edit Ticket' : 'Create New Ticket'}
              </h2>
              <p className="text-sm text-secondary-600 font-medium">
                {ticket.id ? `Editing ticket ID: ${ticket.id}` : 'Fill in the ticket details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-secondary-400 hover:text-accent-500 transition-all duration-300 hover:scale-110"
            disabled={isSaving}
          >
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </h3>
              
              <FormField
                name="ticketSummary"
                label="Ticket Summary"
                placeholder="Brief summary of the ticket"
                maxLength={200}
                required
                icon={<FileText className="w-4 h-4 text-gray-500" />}
              />
              
              <SelectField
                name="project"
                label="Project"
                options={PROJECT_OPTIONS}
                icon={<Tag className="w-4 h-4 text-gray-500" />}
                required
              />
              
              <FormField
                name="issueDescription"
                label="Issue Description"
                placeholder="Detailed description of the issue"
                maxLength={1000}
                required
                icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
                isTextarea
                rows={4}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Ticket Details
              </h3>
              
              <FormField
                name="receivedDate"
                label="Received Date"
                type="date"
                required
                icon={<Calendar className="w-4 h-4 text-gray-500" />}
              />
              
              <SelectField
                name="priority"
                label="Priority"
                options={PRIORITY_OPTIONS}
                icon={<Flag className="w-4 h-4 text-gray-500" />}
                required
              />
              
              <FormField
                name="ticketOwner"
                label="Ticket Owner"
                placeholder="Person responsible for the ticket"
                maxLength={100}
                required
                icon={<User className="w-4 h-4 text-gray-500" />}
              />
              
              <SelectField
                name="bugType"
                label="Bug Type"
                options={BUG_TYPE_OPTIONS}
                icon={<Tag className="w-4 h-4 text-gray-500" />}
                required
              />
              
              <SelectField
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
                icon={<Clock className="w-4 h-4 text-gray-500" />}
                required
              />
            </div>
          </div>

          {/* Contributors Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contributors
            </h3>
            
            <Controller
              name="contributors"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <MultiContributorField
                    contributors={field.value || []}
                    onChange={field.onChange}
                    disabled={isSaving}
                  />
                  {errors.contributors && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {String(errors.contributors?.message || 'Invalid contributors')}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Impact & Review
              </h3>
              
              <FormField
                name="impact"
                label="Impact"
                placeholder="Impact description"
                maxLength={500}
                icon={<Target className="w-4 h-4 text-gray-500" />}
                isTextarea
                rows={3}
              />
              
              <FormField
                name="review"
                label="Review"
                placeholder="Review notes"
                maxLength={500}
                icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
                isTextarea
                rows={3}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </h3>
              
              <FormField
                name="contact"
                label="Contact"
                placeholder="Contact information"
                maxLength={200}
                icon={<Phone className="w-4 h-4 text-gray-500" />}
              />
              
              <FormField
                name="employeeId"
                label="Employee ID"
                placeholder="Employee ID"
                maxLength={50}
                icon={<Hash className="w-4 h-4 text-gray-500" />}
              />
              
              <FormField
                name="employeeName"
                label="Employee Name"
                placeholder="Employee name"
                maxLength={100}
                icon={<User className="w-4 h-4 text-gray-500" />}
              />
              
              <FormField
                name="messageId"
                label="Message ID"
                placeholder="Message ID (auto-generated)"
                maxLength={100}
                icon={<Hash className="w-4 h-4 text-gray-500" />}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <div className="flex gap-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isSaving}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary flex items-center gap-2"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
            
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isSaving || (!isValid && Object.keys(errors).length > 0)}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};