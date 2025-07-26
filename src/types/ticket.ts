export type Priority = 'LOW' | 'PRIORITY' | 'MODERATE' | 'HIGH';
export type BugType = 'BUG' | 'ENHANCEMENT' | 'TASK';
export type Status = 'ASSIGNED' | 'OPENED' | 'CLOSED' | 'FIXED' | 'NEW' | 'PENDING' | 'RESOLVED';

export interface Contributor {
  id: number;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  phone?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id?: number;
  ticketSummary: string;
  project: string;
  issueDescription: string;
  receivedDate: string;
  priority: Priority;
  ticketOwner: string;
  contributor: string | Contributor; // Legacy field - kept for backward compatibility
  contributors?: (string | Contributor)[]; // New field for multiple contributors
  contributorId?: number; // Legacy ID of existing contributor
  contributorIds?: number[]; // New field for multiple contributor IDs
  contributorName?: string; // Legacy name of contributor (fallback option)
  contributorNames?: string[]; // New field for multiple contributor names
  bugType: BugType;
  status: Status;
  review: string;
  impact: string;
  contact: string;
  employeeId: string;
  employeeName: string;
  messageId: string;
}

export interface TicketFormData extends Omit<Ticket, 'id'> {}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'badge-low' },
  { value: 'MODERATE', label: 'Moderate', color: 'badge-medium' },
  { value: 'PRIORITY', label: 'Priority', color: 'badge-warning' },
  { value: 'HIGH', label: 'High', color: 'badge-high' },
];

export const BUG_TYPE_OPTIONS: { value: BugType; label: string; color: string }[] = [
  { value: 'BUG', label: 'Bug', color: 'badge-error' },
  { value: 'ENHANCEMENT', label: 'Enhancement', color: 'badge-info' },
  { value: 'TASK', label: 'Task', color: 'badge-warning' },
];

export const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-gray-100 text-gray-800' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  { value: 'OPENED', label: 'Opened', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PENDING', label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  { value: 'FIXED', label: 'Fixed', color: 'bg-green-100 text-green-800' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
];