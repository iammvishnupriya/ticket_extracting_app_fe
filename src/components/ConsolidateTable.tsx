import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  Download, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import type { ConsolidateResponse } from '../types/consolidate';
import { downloadAsJSON, downloadAsExcel } from '../utils/validation';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface ConsolidateTableProps {
  onRefresh?: () => void;
}

export const ConsolidateTable: React.FC<ConsolidateTableProps> = ({ onRefresh }) => {
  const [consolidateData, setConsolidateData] = useState<ConsolidateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadConsolidateData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketService.getConsolidateData();
      console.log('Consolidate data received:', data);
      setConsolidateData(data);
    } catch (error: any) {
      console.error('Error loading consolidate data:', error);
      setError(error.message || 'Failed to load consolidation data');
      toast.error('Failed to load consolidation data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsolidateData();
  }, []);

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

  const handleRefresh = () => {
    loadConsolidateData();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleExportJSON = () => {
    const filename = `consolidate_report_${new Date().toISOString().split('T')[0]}.json`;
    downloadAsJSON(consolidateData, filename);
    toast.success('Consolidation report exported as JSON successfully');
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    const filename = `consolidate_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Transform data for Excel export with proper column headers
    const excelData = consolidateData.map((item, index) => ({
      'S.No': item.sNo || (index + 1),
      'Project': item.project,
      'Closed Bugs': item.closedCount,
      'Open Bugs': item.openCount,
      'Total Bugs': item.totalBugs
    }));
    
    downloadAsExcel(excelData, filename, 'Bug Consolidation Report');
    toast.success('Consolidation report exported as Excel successfully');
    setShowExportDropdown(false);
  };

  const getTotalStats = () => {
    return consolidateData.reduce(
      (acc, item) => ({
        totalProjects: acc.totalProjects + 1,
        totalClosed: acc.totalClosed + item.closedCount,
        totalOpen: acc.totalOpen + item.openCount,
        totalBugs: acc.totalBugs + item.totalBugs,
      }),
      { totalProjects: 0, totalClosed: 0, totalOpen: 0, totalBugs: 0 }
    );
  };



  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner size="lg" message="Loading consolidation data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bugs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBugs}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed Bugs</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalClosed}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Bugs</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalOpen}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bug Tracking Consolidation</h2>
                <p className="text-sm text-gray-600">
                  Project-wise bug summary and status overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2"
                title="Refresh consolidation data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              {/* Export Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="btn-secondary flex items-center gap-2"
                  title="Export consolidation report"
                  disabled={consolidateData.length === 0}
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
            </div>
          </div>
        </div>

        <div className="card-body">
          {consolidateData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">No consolidation data found. Try refreshing or check if tickets exist.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Closed Bugs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Bugs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Bugs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consolidateData.map((item, index) => {
                    console.log('Rendering item:', item, 'sNo:', item.sNo);
                    return (
                      <tr key={item.sNo || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sNo || (index + 1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.project}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {item.closedCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.openCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.totalBugs}
                          </span>
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
    </div>
  );
};

export default ConsolidateTable;