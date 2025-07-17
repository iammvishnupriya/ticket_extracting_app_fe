import React, { useState, useEffect, useMemo } from 'react';
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
  Ticket, 
  Priority, 
  BugType, 
  Status 
} from '../types/ticket';
import { PROJECT_NAMES } from '../constants/projects';

// Convert project names to options for SelectField
const PROJECT_OPTIONS = PROJECT_NAMES.map(project => ({
  value: project,
  label: project,
  color: '#6b7280' // Default gray color for projects
}));

// Contributor options
const CONTRIBUTOR_NAMES = [
  'Kalpana V',
  'Nandhini P',
  'Manoj',
  'Afreena',
  'Arun Prasad',
  'Venmani',
  'Athithya',
  'Others'
];

const CONTRIBUTOR_OPTIONS = CONTRIBUTOR_NAMES.map(contributor => ({
  value: contributor,
  label: contributor,
  color: '#6b7280' // Default gray color for contributors
}));

import { ticketValidationSchema } from '../utils/validation';
import { getCharacterCount, isCharacterLimitExceeded, generateMessageId } from '../utils/validation';
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
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketValidationSchema),
    defaultValues: {
      ticketSummary: ticket.ticketSummary || '',
      project: ticket.project || '',
      issueDescription: ticket.issueDescription || '',
      receivedDate: ticket.receivedDate || '',
      priority: ticket.priority || 'LOW',
      ticketOwner: ticket.ticketOwner || '',
      contributor: ticket.contributor || '',
      bugType: ticket.bugType || 'BUG',
      status: ticket.status || 'NEW',
      review: ticket.review || '',
      impact: ticket.impact || '',
      contact: ticket.contact || '',
      employeeId: ticket.employeeId || '',
      employeeName: ticket.employeeName || '',
      messageId: ticket.messageId || generateMessageId(),
    },
    mode: 'onChange',
  });

  console.log('TicketEditor rendered with isSaving:', isSaving);
  console.log('Form validation state - isValid:', isValid, 'errors:', errors);

  // Reset form when ticket changes
  useEffect(() => {
    reset({
      ticketSummary: ticket.ticketSummary || '',
      project: ticket.project || '',
      issueDescription: ticket.issueDescription || '',
      receivedDate: ticket.receivedDate || '',
      priority: ticket.priority || 'LOW',
      ticketOwner: ticket.ticketOwner || '',
      contributor: ticket.contributor || '',
      bugType: ticket.bugType || 'BUG',
      status: ticket.status || 'NEW',
      review: ticket.review || '',
      impact: ticket.impact || '',
      contact: ticket.contact || '',
      employeeId: ticket.employeeId || '',
      employeeName: ticket.employeeName || '',
      messageId: ticket.messageId || generateMessageId(),
    });
  }, [ticket, reset]);

  // Simple function to get character count for a field
  const getFieldCharacterCount = (fieldName: keyof TicketFormData) => {
    const value = watch(fieldName);
    return typeof value === 'string' ? value.length : 0;
  };

  const handleFormSubmit = async (data: TicketFormData) => {
    try {
      console.log('Submitting ticket data:', data);
      // Convert TicketFormData to Ticket by adding id if it exists
      const ticketData: Ticket = {
        ...data,
        id: ticket.id
      };
      await onSave(ticketData);
    } catch (error) {
      console.error('Error saving ticket:', error);
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
        render={({ field }) => (
          <div className="relative">
            {isTextarea ? (
              <textarea
                {...field}
                value={field.value || ''}
                id={name}
                rows={rows}
                placeholder={placeholder}
                className={`input-field resize-y scrollbar-thin ${
                  errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                } ${
                  maxLength && isCharacterLimitExceeded(String(field.value || ''), maxLength)
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                disabled={isSaving}
              />
            ) : (
              <input
                {...field}
                value={field.value || ''}
                id={name}
                type={type}
                placeholder={placeholder}
                className={`input-field ${
                  errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                } ${
                  maxLength && isCharacterLimitExceeded(String(field.value || ''), maxLength)
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                disabled={isSaving}
              />
            )}
            
            {maxLength && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                <span className={isCharacterLimitExceeded(String(field.value || ''), maxLength) ? 'text-red-500' : ''}>
                  {getCharacterCount(String(field.value || ''), maxLength)}
                </span>
              </div>
            )}
          </div>
        )}
      />
      
      {errors[name] && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors[name]?.message}
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
          {errors[name]?.message}
        </p>
      )}
    </div>
  ), [control, errors, isSaving]);

  const ContributorField: React.FC<{
    name: keyof TicketFormData;
    label: string;
    icon?: React.ReactNode;
    required?: boolean;
  }> = ({ name, label, icon, required = false }) => {
    const watchedValue = watch(name);
    const [showCustomInput, setShowCustomInput] = useState(
      watchedValue && !CONTRIBUTOR_NAMES.includes(String(watchedValue))
    );
    
    return (
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
            <div className="space-y-2">
              <select
                value={CONTRIBUTOR_NAMES.includes(field.value || '') ? field.value || '' : 'Others'}
                onChange={(e) => {
                  if (e.target.value === 'Others') {
                    setShowCustomInput(true);
                    // Keep current value if it's custom, otherwise clear it
                    if (CONTRIBUTOR_NAMES.includes(field.value || '')) {
                      field.onChange('');
                    }
                  } else {
                    setShowCustomInput(false);
                    field.onChange(e.target.value);
                  }
                }}
                className={`input-field ${
                  errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                disabled={isSaving}
              >
                {CONTRIBUTOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {showCustomInput && (
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Enter contributor name"
                  className={`input-field ${
                    errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isSaving}
                />
              )}
            </div>
          )}
        />
        
        {errors[name] && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors[name]?.message}
          </p>
        )}
      </div>
    );
  };

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
        {/* Debug: Show validation errors */}
        {process.env.NODE_ENV === 'development' && Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Form Validation Errors:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error?.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                name="ticketSummary"
                label="Ticket Summary"
                placeholder="Brief summary of the ticket"
                maxLength={500}
                required
                icon={<FileText className="w-4 h-4 text-gray-600" />}
              />
              
              <SelectField
                name="project"
                label="Project"
                options={PROJECT_OPTIONS}
                required
                icon={<Tag className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="receivedDate"
                label="Received Date"
                type="date"
                required
                icon={<Calendar className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="messageId"
                label="Message ID"
                placeholder="Unique message identifier"
                required
                icon={<Hash className="w-4 h-4 text-gray-600" />}
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Status & Priority
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SelectField
                name="priority"
                label="Priority"
                options={PRIORITY_OPTIONS}
                required
                icon={<Flag className="w-4 h-4 text-gray-600" />}
              />
              
              <SelectField
                name="bugType"
                label="Bug Type"
                options={BUG_TYPE_OPTIONS}
                required
                icon={<Settings className="w-4 h-4 text-gray-600" />}
              />
              
              <SelectField
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
                required
                icon={<Clock className="w-4 h-4 text-gray-600" />}
              />
            </div>
          </div>

          {/* Assignment & Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Assignment & Contact
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                name="ticketOwner"
                label="Ticket Owner"
                placeholder="Person responsible for the ticket"
                maxLength={100}
                required
                icon={<User className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="employeeName"
                label="Employee Name"
                placeholder="Full name of the employee"
                maxLength={100}
                icon={<User className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="employeeId"
                label="Employee ID"
                placeholder="Employee identifier"
                maxLength={50}
                icon={<Hash className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="contact"
                label="Contact"
                placeholder="Contact information"
                maxLength={100}
                icon={<Phone className="w-4 h-4 text-gray-600" />}
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Technical Details
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ContributorField
                name="contributor"
                label="Contributor"
                icon={<User className="w-4 h-4 text-gray-600" />}
              />
              
              <FormField
                name="impact"
                label="Impact"
                placeholder="Impact description"
                maxLength={500}
                icon={<Target className="w-4 h-4 text-gray-600" />}
                isTextarea
              />
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Detailed Information
            </h3>
            
            <FormField
              name="issueDescription"
              label="Issue Description"
              placeholder="Detailed description of the issue"
              maxLength={2000}
              required
              icon={<AlertCircle className="w-4 h-4 text-gray-600" />}
              isTextarea
              rows={6}
            />
            
            <FormField
              name="review"
              label="Review"
              placeholder="Review comments and notes"
              maxLength={1000}
              icon={<MessageSquare className="w-4 h-4 text-gray-600" />}
              isTextarea
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSaving}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Table
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            
              <button
                type="submit"
                disabled={isSaving || !isValid}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
          </div>
        </form>
      </div>
    </div>
  );
};