import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Hash,
  RefreshCw,
  Plus,
  ChevronDown,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { 
  PRIORITY_OPTIONS, 
  STATUS_OPTIONS
} from '../types/ticket';
import type { 
  Ticket, 
  Priority, 
  Status 
} from '../types/ticket';
import { formatDate, truncateText, downloadAsJSON, downloadAsExcel, getContributorName, getContributorDisplayValue } from '../utils/validation';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import { useProjects } from '../hooks/useProjects';

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  onView: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

type SortField = 'id' | 'ticketSummary' | 'project' | 'receivedDate' | 'priority' | 'status' | 'ticketOwner' | 'contributor';
type SortDirection = 'asc' | 'desc';

export const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onRefresh,
  onCreateNew,
}) => {
  // Use projects hook to get dynamic project names
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('receivedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPriorityOption = (priority: Priority) => 
    PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[0];

  const getStatusOption = (status: Status) => 
    STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unique projects for filter dropdown - combine backend projects with any additional from tickets
  const uniqueProjects = React.useMemo(() => {
    const ticketProjects = Array.from(new Set(tickets.map(ticket => ticket.project)))
      .filter(project => project && project.trim().length > 0);
    
    // Combine backend projects with any additional projects from tickets
    const allProjects = [...projects, ...ticketProjects];
    return Array.from(new Set(allProjects)).sort();
  }, [tickets, projects]);

  const filteredAndSortedTickets = React.useMemo(() => {
    let filtered = tickets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          (ticket.ticketSummary || '').toLowerCase().includes(searchTermLower) ||
          (ticket.issueDescription || '').toLowerCase().includes(searchTermLower) ||
          (ticket.project || '').toLowerCase().includes(searchTermLower) ||
          (ticket.ticketOwner || '').toLowerCase().includes(searchTermLower) ||
          (ticket.employeeName || '').toLowerCase().includes(searchTermLower) ||
          (ticket.messageId || '').toLowerCase().includes(searchTermLower) ||
          (ticket.contributorNames || getContributorDisplayValue(ticket) || '').toLowerCase().includes(searchTermLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Apply project filter
    if (projectFilter) {
      filtered = filtered.filter(ticket => 
        (ticket.project || '').toLowerCase().includes(projectFilter.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'receivedDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'contributor') {
        aValue = a.contributorNames || getContributorDisplayValue(a);
        bValue = b.contributorNames || getContributorDisplayValue(b);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, projectFilter, sortField, sortDirection]);

  const handleDeleteConfirm = (id: number, summary: string) => {
    if (window.confirm(`Are you sure you want to delete the ticket "${truncateText(summary, 50)}"?`)) {
      onDelete(id);
    }
  };

  const handleExportJSON = () => {
    const filename = `tickets_export_${new Date().toISOString().split('T')[0]}.json`;
    downloadAsJSON(filteredAndSortedTickets, filename);
    toast.success('Tickets exported as JSON successfully');
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    const filename = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Transform data for Excel export with proper column headers
    const excelData = filteredAndSortedTickets.map((ticket) => ({
      'ID': ticket.id,
      'Ticket Summary': ticket.ticketSummary,
      'Project': ticket.project,
      'Issue Description': ticket.issueDescription,
      'Received Date': ticket.receivedDate,
      'Priority': ticket.priority,
      'Ticket Owner': ticket.ticketOwner,
      'Contributor': ticket.contributorNames || getContributorDisplayValue(ticket),
      'Bug Type': ticket.bugType,
      'Status': ticket.status,
      'Review': ticket.review,
      'Impact': ticket.impact,
      'Contact': ticket.contact,
      'Employee ID': ticket.employeeId,
      'Employee Name': ticket.employeeName,
      'Message ID': ticket.messageId
    }));
    
    downloadAsExcel(excelData, filename, 'Tickets Export');
    toast.success('Tickets exported as Excel successfully');
    setShowExportDropdown(false);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left hover:text-primary-600 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <SortAsc className="w-4 h-4" />
        ) : (
          <SortDesc className="w-4 h-4" />
        )
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner size="lg" message="Loading tickets..." />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <Hash className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
              <p className="text-sm text-gray-600">
                {filteredAndSortedTickets.length} of {tickets.length} tickets
                {(searchTerm || projectFilter || statusFilter || priorityFilter) && (
                  <span className="text-blue-600 ml-1">(filtered)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="btn-secondary flex items-center gap-2"
              title="Refresh tickets"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {/* Export Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="btn-secondary flex items-center gap-2"
                title="Export tickets"
                disabled={filteredAndSortedTickets.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Export as Excel
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      Export as JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onCreateNew}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search summary, description, owner, contributor, employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="w-48 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project..."
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="input-field pl-10 pr-8"
              />
              {projectFilter && (
                <button
                  onClick={() => setProjectFilter('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear project filter"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${
                (statusFilter || priorityFilter || projectFilter) ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter || priorityFilter || projectFilter) && (
                <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                  {[statusFilter, priorityFilter, projectFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || projectFilter || statusFilter || priorityFilter) && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {projectFilter && (
                <span className="badge bg-green-100 text-green-800 flex items-center gap-1">
                  Project: "{projectFilter}"
                  <button
                    onClick={() => setProjectFilter('')}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1">
                  Status: {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                  <button
                    onClick={() => setStatusFilter('')}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {priorityFilter && (
                <span className="badge bg-orange-100 text-orange-800 flex items-center gap-1">
                  Priority: {PRIORITY_OPTIONS.find(p => p.value === priorityFilter)?.label}
                  <button
                    onClick={() => setPriorityFilter('')}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Projects</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Status | '')}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
                  className="input-field"
                >
                  <option value="">All Priorities</option>
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setPriorityFilter('');
                    setProjectFilter('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {filteredAndSortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {tickets.length === 0 
                ? 'Start by processing an email to create your first ticket.'
                : 'Try adjusting your search or filters.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="id">ID</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="ticketSummary">Summary</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <SortButton field="project">Project</SortButton>
                      {projectFilter && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Filtered
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="status">Status</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="priority">Priority</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="ticketOwner">Owner</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="contributor">Contributor</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="receivedDate">Date</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTickets.map((ticket) => {
                  const priorityOption = getPriorityOption(ticket.priority);
                  const statusOption = getStatusOption(ticket.status);
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ticket.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs">
                          <p className="truncate" title={ticket.ticketSummary}>
                            {truncateText(ticket.ticketSummary, 50)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.project}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${statusOption.color}`}>
                          {statusOption.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${priorityOption.color}`}>
                          {priorityOption.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.ticketOwner}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs">
                          <div className="space-y-1">
                            {/* Display contributor names with count badge */}
                            {ticket.contributorNames ? (
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-sm text-gray-700 flex-1"
                                  title={ticket.contributorNames}
                                >
                                  {truncateText(ticket.contributorNames, 30)}
                                </span>
                                {ticket.contributorCount && ticket.contributorCount > 1 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-500 text-white font-medium">
                                    {ticket.contributorCount}
                                  </span>
                                )}
                              </div>
                            ) : ticket.contributors && Array.isArray(ticket.contributors) && ticket.contributors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {ticket.contributors.slice(0, 3).map((contributor, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                                    title={contributor.name || contributor.email}
                                  >
                                    {truncateText(contributor.name || contributor.email || 'Unknown', 15)}
                                  </span>
                                ))}
                                {ticket.contributors.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                    +{ticket.contributors.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : ticket.contributor ? (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                                title={getContributorName(ticket.contributor)}
                              >
                                {truncateText(getContributorName(ticket.contributor), 20)}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-sm">Not assigned</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ticket.receivedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                           <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View button clicked for ticket:', ticket.id);
                              onView(ticket);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                            title="View ticket"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit button clicked for ticket:', ticket.id);
                              onEdit(ticket);
                            }}
                            className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded"
                            title="Edit ticket"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Delete button clicked for ticket:', ticket.id);
                              handleDeleteConfirm(ticket.id!, ticket.ticketSummary);
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded"
                            title="Delete ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};