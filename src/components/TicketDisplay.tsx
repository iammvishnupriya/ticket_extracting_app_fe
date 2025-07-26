import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  Edit, 
  Calendar, 
  User, 
  AlertCircle,
  FileText,
  Clock,

  Tag,
  Flag,
  Settings,
  MessageSquare,
  Target,
  Hash,
  Ticket,
  ArrowLeft
} from 'lucide-react';
import { PRIORITY_OPTIONS, BUG_TYPE_OPTIONS, STATUS_OPTIONS } from '../types/ticket';
import type { Ticket as TicketType } from '../types/ticket';
import { formatDate, copyToClipboard, downloadAsJSON, truncateText, getContributorName, getContributorDisplayValue } from '../utils/validation';
import toast from 'react-hot-toast';

interface TicketDisplayProps {
  ticket: TicketType;
  onEdit: () => void;
  onSave: () => void;
  onBack?: () => void;
  isSaving: boolean;
}

export const TicketDisplay: React.FC<TicketDisplayProps> = ({
  ticket,
  onEdit,
  onSave,
  onBack,
  isSaving,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyField = async (field: string, value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const filename = `ticket_${ticket.id || 'new'}_${new Date().toISOString().split('T')[0]}.json`;
    downloadAsJSON(ticket, filename);
    toast.success('Ticket downloaded successfully');
  };

  const getPriorityOption = (priority: string) => 
    PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[0];

  const getBugTypeOption = (bugType: string) => 
    BUG_TYPE_OPTIONS.find(b => b.value === bugType) || BUG_TYPE_OPTIONS[0];

  const getStatusOption = (status: string) => 
    STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  const FieldRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    fieldKey: string;
    maxLength?: number;
    badge?: { text: string; color: string };
  }> = ({ icon, label, value, fieldKey, maxLength, badge }) => (
    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
          {badge && (
            <span className={`badge ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="flex items-start gap-2">
          <p className="text-sm text-gray-700 flex-1">
            {maxLength && value && value.length > maxLength ? (
              <span title={value}>
                {truncateText(value, maxLength)}
              </span>
            ) : (
              value || <span className="text-gray-400 italic">Not specified</span>
            )}
          </p>
          {value && (
            <button
              onClick={() => handleCopyField(label, value)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title={`Copy ${label.toLowerCase()}`}
            >
              {copiedField === fieldKey ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const priorityOption = getPriorityOption(ticket.priority);
  const bugTypeOption = getBugTypeOption(ticket.bugType);
  const statusOption = getStatusOption(ticket.status);

  return (
    <div className="card animate-slide-up">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Ticket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Extracted Ticket Information
              </h2>
              <p className="text-sm text-gray-600">
                {ticket.id ? `Ticket ID: ${ticket.id}` : 'New ticket ready for review'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="btn-secondary flex items-center gap-2"
                title="Back to table"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center gap-2"
              title="Download ticket as JSON"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onEdit}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {!ticket.id && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Ticket
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Basic Information
            </h3>
            
            <FieldRow
              icon={<FileText className="w-4 h-4 text-gray-600" />}
              label="Ticket Summary"
              value={ticket.ticketSummary}
              fieldKey="ticketSummary"
              maxLength={100}
            />
            
            <FieldRow
              icon={<Tag className="w-4 h-4 text-gray-600" />}
              label="Project"
              value={ticket.project}
              fieldKey="project"
            />
            
            <FieldRow
              icon={<Calendar className="w-4 h-4 text-gray-600" />}
              label="Received Date"
              value={formatDate(ticket.receivedDate)}
              fieldKey="receivedDate"
            />
            
            <FieldRow
              icon={<Hash className="w-4 h-4 text-gray-600" />}
              label="Message ID"
              value={ticket.messageId}
              fieldKey="messageId"
              maxLength={50}
            />
          </div>

          {/* Status & Priority */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Status & Priority
            </h3>
            
            <FieldRow
              icon={<Flag className="w-4 h-4 text-gray-600" />}
              label="Priority"
              value={priorityOption.label}
              fieldKey="priority"
              badge={{ text: priorityOption.label, color: priorityOption.color }}
            />
            
            <FieldRow
              icon={<Settings className="w-4 h-4 text-gray-600" />}
              label="Bug Type"
              value={bugTypeOption.label}
              fieldKey="bugType"
              badge={{ text: bugTypeOption.label, color: bugTypeOption.color }}
            />
            
            <FieldRow
              icon={<Clock className="w-4 h-4 text-gray-600" />}
              label="Status"
              value={statusOption.label}
              fieldKey="status"
              badge={{ text: statusOption.label, color: statusOption.color }}
            />
          </div>

          {/* Assignment & Impact */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Assignment & Impact
            </h3>
            
            <FieldRow
              icon={<User className="w-4 h-4 text-gray-600" />}
              label="Ticket Owner"
              value={ticket.ticketOwner}
              fieldKey="ticketOwner"
            />
            
            {/* Contributors Section */}
            <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Contributors</h3>
                </div>
                <div className="space-y-2">
                  {/* Multiple Contributors Display */}
                  {ticket.contributors && Array.isArray(ticket.contributors) && ticket.contributors.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {ticket.contributors.map((contributor, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <User className="w-3 h-3" />
                            <span>{getContributorName(contributor)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-gray-700 flex-1">
                          {getContributorDisplayValue(ticket)}
                        </p>
                        <button
                          onClick={() => handleCopyField('Contributors', getContributorDisplayValue(ticket))}
                          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          title="Copy contributors"
                        >
                          {copiedField === 'contributors' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  ) : ticket.contributor ? (
                    /* Legacy Single Contributor Display */
                    <div className="flex items-start gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-2">
                        <User className="w-3 h-3" />
                        <span>{getContributorName(ticket.contributor)}</span>
                      </div>
                      <button
                        onClick={() => handleCopyField('Contributor', getContributorName(ticket.contributor))}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Copy contributor"
                      >
                        {copiedField === 'contributor' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No contributors assigned</p>
                  )}
                </div>
              </div>
            </div>
            
            <FieldRow
              icon={<Target className="w-4 h-4 text-gray-600" />}
              label="Impact"
              value={ticket.impact}
              fieldKey="impact"
              maxLength={500}
            />
          </div>

          {/* Technical Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">
              Technical Details
            </h3>
            
            <FieldRow
              icon={<FileText className="w-4 h-4 text-gray-600" />}
              label="Review"
              value={ticket.review}
              fieldKey="review"
              maxLength={500}
            />
          </div>
        </div>

        {/* Full-width sections */}
        <div className="mt-6 space-y-4">
          {/* Issue Description */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                <AlertCircle className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Issue Description</h3>
                  <button
                    onClick={() => handleCopyField('Issue Description', ticket.issueDescription)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy issue description"
                  >
                    {copiedField === 'issueDescription' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {ticket.issueDescription || <span className="text-gray-400 italic">No description provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                <MessageSquare className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Review</h3>
                  <button
                    onClick={() => handleCopyField('Review', ticket.review)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy review"
                  >
                    {copiedField === 'review' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {ticket.review || <span className="text-gray-400 italic">No review provided</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};