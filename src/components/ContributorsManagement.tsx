import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  Hash,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Copy,
  BarChart3,
  Settings,
  FileText,
  Archive,
  UserPlus,
  CheckSquare,
  Square,
  Trash,
  RotateCcw
} from 'lucide-react';
import { contributorService } from '../services/contributorService';
import type { Contributor, ContributorRequest, Department } from '../types/contributor';
import { DEPARTMENT_OPTIONS } from '../types/contributor';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

// Validation schema for contributor form
const contributorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

type ContributorFormData = z.infer<typeof contributorSchema>;

interface ContributorsManagementProps {
  onClose?: () => void;
}

export const ContributorsManagement: React.FC<ContributorsManagementProps> = ({ onClose }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [filteredContributors, setFilteredContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // New state for enhanced features
  const [selectedContributors, setSelectedContributors] = useState<Set<number>>(new Set());
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const [showDepartmentStats, setShowDepartmentStats] = useState(false);
  const [departmentStats, setDepartmentStats] = useState<{ department: string; count: number; activeCount: number }[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'department' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showContributorDetails, setShowContributorDetails] = useState<Contributor | null>(null);


  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setError,
    clearErrors
  } = useForm<ContributorFormData>({
    resolver: zodResolver(contributorSchema),
    defaultValues: {
      name: '',
      email: '',
      employeeId: '',
      department: '',
      phone: '',
      active: true,
      notes: '',
    },
  });

  // Helper function to sort contributors
  const sortContributors = (contributors: Contributor[]) => {
    return [...contributors].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Load contributors and department stats on component mount
  useEffect(() => {
    loadContributors();
    loadDepartmentStats();
  }, []);



  // Filter and sort contributors based on search and filters
  useEffect(() => {
    let filtered = contributors;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contributor =>
        (contributor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contributor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contributor.employeeId && contributor.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contributor.department && contributor.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(contributor =>
        contributor.department === departmentFilter
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contributor =>
        statusFilter === 'active' ? contributor.active : !contributor.active
      );
    }

    // Apply sorting
    filtered = sortContributors(filtered);

    setFilteredContributors(filtered);
  }, [contributors, searchTerm, departmentFilter, statusFilter, sortBy, sortOrder]);

  const loadContributors = async () => {
    try {
      setIsLoading(true);
      const data = await contributorService.getAllContributors();
      setContributors(data);
    } catch (error: any) {
      console.error('Error loading contributors:', error);
      toast.error(error.message || 'Failed to load contributors');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartmentStats = async () => {
    try {
      const stats = await contributorService.getDepartmentStats();
      setDepartmentStats(stats);
    } catch (error: any) {
      console.error('Error loading department stats:', error);
      toast.error('Failed to load department statistics');
    }
  };

  const handleFormSubmit = async (data: ContributorFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      // Check for duplicate email
      if (data.email) {
        const emailExists = await contributorService.checkEmailExists(
          data.email,
          editingContributor?.id
        );
        if (emailExists) {
          setError('email', { message: 'Email already exists' });
          return;
        }
      }

      // Check for duplicate employee ID
      if (data.employeeId) {
        const employeeIdExists = await contributorService.checkEmployeeIdExists(
          data.employeeId,
          editingContributor?.id
        );
        if (employeeIdExists) {
          setError('employeeId', { message: 'Employee ID already exists' });
          return;
        }
      }

      const contributorData: ContributorRequest = {
        name: data.name,
        email: data.email,
        employeeId: data.employeeId || undefined,
        department: data.department || undefined,
        phone: data.phone || undefined,
        active: data.active,
        notes: data.notes || undefined,
      };

      if (editingContributor) {
        await contributorService.updateContributor(editingContributor.id, contributorData);
        toast.success('Contributor updated successfully');
      } else {
        await contributorService.createContributor(contributorData);
        toast.success('Contributor created successfully');
      }

      await loadContributors();
      handleCancelForm();
    } catch (error: any) {
      console.error('Error saving contributor:', error);
      toast.error(error.message || 'Failed to save contributor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contributor: Contributor) => {
    setEditingContributor(contributor);
    reset({
      name: contributor.name,
      email: contributor.email,
      employeeId: contributor.employeeId || '',
      department: contributor.department || '',
      phone: contributor.phone || '',
      active: contributor.active,
      notes: contributor.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (contributor: Contributor) => {
    if (!window.confirm(`Are you sure you want to delete "${contributor.name}"? This will deactivate the contributor.`)) {
      return;
    }

    try {
      await contributorService.deleteContributor(contributor.id);
      toast.success('Contributor deleted successfully');
      await loadContributors();
    } catch (error: any) {
      console.error('Error deleting contributor:', error);
      toast.error(error.message || 'Failed to delete contributor');
    }
  };

  const handleToggleStatus = async (contributor: Contributor) => {
    try {
      if (contributor.active) {
        await contributorService.deactivateContributor(contributor.id);
        toast.success('Contributor deactivated');
      } else {
        await contributorService.activateContributor(contributor.id);
        toast.success('Contributor activated');
      }
      await loadContributors();
    } catch (error: any) {
      console.error('Error toggling contributor status:', error);
      toast.error(error.message || 'Failed to update contributor status');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingContributor(null);
    reset();
    clearErrors();
  };

  const handleCreateNew = () => {
    setEditingContributor(null);
    reset({
      name: '',
      email: '',
      employeeId: '',
      department: '',
      phone: '',
      active: true,
      notes: '',
    });
    setShowForm(true);
  };

  // Enhanced features handlers

  const handleSelectContributor = (contributorId: number) => {
    const newSelected = new Set(selectedContributors);
    if (newSelected.has(contributorId)) {
      newSelected.delete(contributorId);
    } else {
      newSelected.add(contributorId);
    }
    setSelectedContributors(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContributors.size === filteredContributors.length) {
      setSelectedContributors(new Set());
    } else {
      setSelectedContributors(new Set(filteredContributors.map(c => c.id)));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedContributors.size === 0) return;
    
    try {
      await contributorService.bulkActivateContributors(Array.from(selectedContributors));
      toast.success(`${selectedContributors.size} contributors activated`);
      setSelectedContributors(new Set());
      await loadContributors();
    } catch (error: any) {
      console.error('Error bulk activating contributors:', error);
      toast.error('Failed to activate contributors');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedContributors.size === 0) return;
    
    try {
      await contributorService.bulkDeactivateContributors(Array.from(selectedContributors));
      toast.success(`${selectedContributors.size} contributors deactivated`);
      setSelectedContributors(new Set());
      await loadContributors();
    } catch (error: any) {
      console.error('Error bulk deactivating contributors:', error);
      toast.error('Failed to deactivate contributors');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContributors.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedContributors.size} contributors? This will deactivate them.`)) {
      return;
    }

    try {
      await contributorService.bulkDeleteContributors(Array.from(selectedContributors));
      toast.success(`${selectedContributors.size} contributors deleted`);
      setSelectedContributors(new Set());
      await loadContributors();
    } catch (error: any) {
      console.error('Error bulk deleting contributors:', error);
      toast.error('Failed to delete contributors');
    }
  };

  const handlePermanentDelete = async (contributor: Contributor) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${contributor.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await contributorService.permanentlyDeleteContributor(contributor.id);
      toast.success('Contributor permanently deleted');
      await loadContributors();
    } catch (error: any) {
      console.error('Error permanently deleting contributor:', error);
      toast.error(error.message || 'Failed to permanently delete contributor');
    }
  };



  const handleAdvancedSearch = async (searchParams: {
    name?: string;
    email?: string;
    department?: string;
    employeeId?: string;
    active?: boolean;
  }) => {
    try {
      setIsLoading(true);
      const results = await contributorService.searchContributors(searchParams);
      setContributors(results);
    } catch (error: any) {
      console.error('Error performing advanced search:', error);
      toast.error('Failed to search contributors');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner size="lg" message="Loading contributors..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contributors Management</h2>
                <p className="text-sm text-gray-600">
                  Manage team members and contributors
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDepartmentStats(!showDepartmentStats)}
                className="btn-secondary flex items-center gap-2"
                title="Department Statistics"
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              


              <button
                onClick={loadContributors}
                className="btn-secondary flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              <button
                onClick={handleCreateNew}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contributor
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Department Statistics */}
      {showDepartmentStats && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Department Statistics</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departmentStats.map((stat) => (
                <div key={stat.department} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{stat.department}</h4>
                      <p className="text-2xl font-bold text-blue-600">{stat.count}</p>
                      <p className="text-xs text-gray-500">
                        {stat.activeCount} active, {stat.count - stat.activeCount} inactive
                      </p>
                    </div>
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedContributors.size > 0 && (
        <div className="card animate-slide-up bg-blue-50 border-blue-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedContributors.size} contributor(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="btn-secondary text-green-600 hover:text-green-700 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Activate
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="btn-secondary text-orange-600 hover:text-orange-700 flex items-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn-secondary text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedContributors(new Set())}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingContributor ? 'Edit Contributor' : 'Add New Contributor'}
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                        placeholder="Enter full name"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                        placeholder="Enter email address"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className={`input-field ${errors.employeeId ? 'border-red-300' : ''}`}
                        placeholder="Enter employee ID"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.employeeId && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.employeeId.message}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`input-field ${errors.department ? 'border-red-300' : ''}`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENT_OPTIONS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.department && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.department.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="tel"
                        className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                        placeholder="Enter phone number"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Active Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Controller
                    name="active"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className={`input-field resize-y ${errors.notes ? 'border-red-300' : ''}`}
                      placeholder="Additional notes about the contributor"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingContributor ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="space-y-4">
            {/* Main Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contributors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="input-field w-48"
              >
                <option value="">All Departments</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="input-field w-32"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Advanced Search Toggle */}
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`btn-secondary flex items-center gap-2 ${showAdvancedSearch ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Advanced
              </button>
            </div>

            {/* Advanced Search */}
            {showAdvancedSearch && (
              <div className="border-t pt-4 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="input-field"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAdvancedSearch({ name: e.target.value });
                      }
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Search by email..."
                    className="input-field"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAdvancedSearch({ email: e.target.value });
                      }
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by employee ID..."
                    className="input-field"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAdvancedSearch({ employeeId: e.target.value });
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sort and View Options */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input-field text-sm py-1 px-2 w-32"
                  >
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="department">Department</option>
                    <option value="createdAt">Created</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="btn-secondary p-1"
                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode('table')}
                  className={`btn-secondary p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : ''}`}
                  title="Table view"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`btn-secondary p-2 ${viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : ''}`}
                  title="Card view"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Contributors ({filteredContributors.length})
          </h3>
        </div>
        <div className="card-body">
          {filteredContributors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contributors found</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedContributors.size === filteredContributors.length && filteredContributors.length > 0 ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        Name
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContributors.map((contributor) => (
                    <tr key={contributor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleSelectContributor(contributor.id)}
                            className="mr-3 text-gray-400 hover:text-gray-600"
                          >
                            {selectedContributors.has(contributor.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {contributor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contributor.name}
                            </div>
                            {contributor.employeeId && (
                              <div className="text-sm text-gray-500">
                                ID: {contributor.employeeId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contributor.email}</div>
                        {contributor.phone && (
                          <div className="text-sm text-gray-500">{contributor.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contributor.department || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contributor.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {contributor.active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowContributorDetails(contributor)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(contributor)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit contributor"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(contributor.email)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Copy email"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(contributor)}
                            className={`p-1 ${
                              contributor.active
                                ? 'text-orange-600 hover:text-orange-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={contributor.active ? 'Deactivate' : 'Activate'}
                          >
                            {contributor.active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(contributor)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Soft delete"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          {!contributor.active && (
                            <button
                              onClick={() => handlePermanentDelete(contributor)}
                              className="text-red-800 hover:text-red-900 p-1"
                              title="Permanent delete"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContributors.map((contributor) => (
                <div key={contributor.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectContributor(contributor.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedContributors.has(contributor.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {contributor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{contributor.name}</h4>
                        {contributor.employeeId && (
                          <p className="text-xs text-gray-500">ID: {contributor.employeeId}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        contributor.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {contributor.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{contributor.email}</span>
                    </div>
                    {contributor.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{contributor.phone}</span>
                      </div>
                    )}
                    {contributor.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>{contributor.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowContributorDetails(contributor)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(contributor)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(contributor.email)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Copy email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(contributor)}
                        className={`p-1 ${
                          contributor.active
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={contributor.active ? 'Deactivate' : 'Activate'}
                      >
                        {contributor.active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(contributor)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      {!contributor.active && (
                        <button
                          onClick={() => handlePermanentDelete(contributor)}
                          className="text-red-800 hover:text-red-900 p-1"
                          title="Permanent delete"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contributor Details Modal */}
      {showContributorDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Contributor Details</h3>
                <button
                  onClick={() => setShowContributorDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{showContributorDetails.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">{showContributorDetails.email}</p>
                      <button
                        onClick={() => copyToClipboard(showContributorDetails.email)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {showContributorDetails.employeeId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <p className="text-sm text-gray-900">{showContributorDetails.employeeId}</p>
                    </div>
                  )}
                  {showContributorDetails.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <p className="text-sm text-gray-900">{showContributorDetails.department}</p>
                    </div>
                  )}
                  {showContributorDetails.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900">{showContributorDetails.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        showContributorDetails.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {showContributorDetails.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {showContributorDetails.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{showContributorDetails.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <p className="text-sm text-gray-900">
                      {new Date(showContributorDetails.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                    <p className="text-sm text-gray-900">
                      {new Date(showContributorDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleEdit(showContributorDetails);
                      setShowContributorDetails(null);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowContributorDetails(null)}
                    className="btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};