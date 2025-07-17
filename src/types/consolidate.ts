export interface ConsolidateResponse {
  sNo: number;
  project: string;
  closedCount: number;
  openCount: number;
  totalBugs: number;
}

export interface ConsolidateApiError {
  message: string;
  status: number;
  details?: any;
}