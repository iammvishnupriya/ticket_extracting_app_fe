import React, { useState, useEffect } from 'react';
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
  Hash 
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
import { ticketValidationSchema } from '../utils/validation';
import { getCharacterCount, isCharacterLimitExceeded } from '../utils/validation';
import toast from 'react-hot-toast';

interface TicketEditorProps {
  ticket: Ticket;
  onSave: (ticket: Ticket) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const TicketEditor: React.FC<TicketEditorProps> = ({
  ticket,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [characterCounts, setCharacterCounts] = useState<Record<string, number>>({});

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<Ticket>({
    resolver: zodResolver(ticketValidationSchema),
    defaultValues: ticket,
    mode: 'onChange',
  });

  const watchedValues = watch();

  useEffect(() => {
    // Update character counts when form values change
    const counts: Record<string, number> = {};
    Object.entries(watchedValues).forEach(([key, value]) => {
      if (typeof value === 'string') {
        counts[key] = value.length;
      }
    });
    setCharacterCounts(counts);
  }, [watchedValues]);

  const handleFormSubmit = async (data: Ticket) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Failed to save ticket. Please try again.');
    }
  };

  const FormField: React.FC<{
    name: keyof Ticket;
    label: string;
    type?: string;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    icon?: React.ReactNode;
    isTextarea?: boolean;
    rows?: number;
  }> = ({ 
    name, 
    label, 
    type = 'text', 
    placeholder, 
    maxLength, 
    required = false,
    icon,
    isTextarea = false,
    rows = 3
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
  );

  const SelectField: React.FC<{
    name: keyof Ticket;
    label: string;
    options: { value: string; label: string; color: string }[];
    icon?: React.ReactNode;
    required?: boolean;
  }> = ({ name, label, options, icon, required = false }) => (
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
  );

  return (
    <div className="card animate-slide-up">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {ticket.id ? 'Edit Ticket' : 'Create New Ticket'}
              </h2>
              <p className="text-sm text-gray-600">
                {ticket.id ? `Editing ticket ID: ${ticket.id}` : 'Fill in the ticket details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="card-body">
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
              <FormField
                name="contributor"
                label="Contributor"
                placeholder="Additional contributors"
                maxLength={500}
                icon={<User className="w-4 h-4 text-gray-600" />}
                isTextarea
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
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
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
        </form>
      </div>
    </div>
  );
};