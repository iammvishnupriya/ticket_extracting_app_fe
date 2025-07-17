import { z } from 'zod';

export const ticketValidationSchema = z.object({
  ticketSummary: z.string()
    .min(1, 'Ticket summary is required')
    .max(500, 'Ticket summary must be less than 500 characters'),
  
  project: z.string()
    .min(1, 'Project is required')
    .max(100, 'Project must be less than 100 characters'),
  
  issueDescription: z.string()
    .min(1, 'Issue description is required')
    .max(2000, 'Issue description must be less than 2000 characters'),
  
  receivedDate: z.string()
    .min(1, 'Received date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  priority: z.enum(['LOW', 'PRIORITY', 'MODERATE', 'HIGH'] as const),
  
  ticketOwner: z.string()
    .min(1, 'Ticket owner is required')
    .max(100, 'Ticket owner must be less than 100 characters'),
  
  contributor: z.string()
    .max(500, 'Contributor must be less than 500 characters')
    .default(''),
  
  bugType: z.enum(['BUG', 'ENHANCEMENT', 'TASK'] as const),
  
  status: z.enum(['ASSIGNED', 'OPENED', 'CLOSED', 'FIXED', 'NEW', 'PENDING', 'RESOLVED'] as const),
  
  review: z.string()
    .max(1000, 'Review must be less than 1000 characters')
    .default(''),
  
  impact: z.string()
    .max(500, 'Impact must be less than 500 characters')
    .default(''),
  
  contact: z.string()
    .max(100, 'Contact must be less than 100 characters')
    .default(''),
  
  employeeId: z.string()
    .max(50, 'Employee ID must be less than 50 characters')
    .default(''),
  
  employeeName: z.string()
    .max(100, 'Employee name must be less than 100 characters')
    .default(''),
  
  messageId: z.string()
    .min(1, 'Message ID is required'),
});

export type TicketValidationErrors = {
  [K in keyof z.infer<typeof ticketValidationSchema>]?: string[];
};

export const validateTicket = (data: any): { success: boolean; errors?: TicketValidationErrors } => {
  const result = ticketValidationSchema.safeParse(data);
  
  if (result.success) {
    return { success: true };
  }
  
  const errors: TicketValidationErrors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof z.infer<typeof ticketValidationSchema>;
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field]!.push(issue.message);
  });
  
  return { success: false, errors };
};

export const getCharacterCount = (text: string, maxLength: number): string => {
  return `${text.length}/${maxLength}`;
};

export const isCharacterLimitExceeded = (text: string, maxLength: number): boolean => {
  return text.length > maxLength;
};

export const formatDate = (date: string): string => {
  try {
    const parsed = new Date(date);
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
};

export const formatDateTime = (date: string): string => {
  try {
    const parsed = new Date(date);
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadAsJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAsExcel = (data: any[], filename: string, sheetName: string = 'Sheet1'): void => {
  // Dynamically import xlsx to avoid bundling issues
  import('xlsx').then((XLSX) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Write the file
    XLSX.writeFile(workbook, filename);
  }).catch((error) => {
    console.error('Error loading xlsx library:', error);
    // Fallback to JSON download if xlsx fails
    downloadAsJSON(data, filename.replace('.xlsx', '.json'));
  });
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};