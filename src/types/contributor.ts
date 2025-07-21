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

export interface ContributorRequest {
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  phone?: string;
  active?: boolean;
  notes?: string;
}

export interface ContributorOption {
  value: number;
  label: string;
  email: string;
  department?: string;
  active: boolean;
}

export const DEPARTMENT_OPTIONS = [
  'L1 Support',
  'L2 Support', 
  'L3 Support',
  'Development',
  'QA',
  'DevOps',
  'Management',
  'Other'
] as const;

export type Department = typeof DEPARTMENT_OPTIONS[number];