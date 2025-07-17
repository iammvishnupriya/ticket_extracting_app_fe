import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Mail, Database, Settings, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

import { EmailInput } from './components/EmailInput';
import { TicketDisplay } from './components/TicketDisplay';
import { TicketEditor } from './components/TicketEditor';
import { TicketsTable } from './components/TicketsTable';
import { useTicket } from './hooks/useTicket';
import type { Ticket } from './types/ticket';
import { generateMessageId } from './utils/validation';
import { ticketService } from './services/ticketService';

type ViewMode = 'email' | 'display' | 'edit' | 'table';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('email');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const {
    currentTicket,
    allTickets,
    isLoading,
    isProcessing,
    isSaving,
    error,
    processEmailText,
    saveTicket,
    updateTicket,
    loadAllTickets,
    deleteTicket,
    setCurrentTicket,
    clearCurrentTicket,
    clearError,
  } = useTicket();

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const isHealthy = await ticketService.healthCheck();
      setIsBackendHealthy(isHealthy);
    } catch (error) {
      setIsBackendHealthy(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleProcessEmail = async (emailText: string) => {
    await processEmailText(emailText);
    if (!error) {
      setCurrentView('display');
    }
  };

  const handleSaveTicket = async (ticketData?: Ticket) => {
    const ticket = ticketData || currentTicket;
    if (!ticket) return;

    try {
      if (ticket.id) {
        // Update existing ticket
        await updateTicket(ticket.id, ticket);
      } else {
        // Create new ticket - ensure we have a messageId
        const ticketToSave = {
          ...ticket,
          messageId: ticket.messageId || generateMessageId(),
        };
        await saveTicket(ticketToSave);
      }
      
      if (!error) {
        setCurrentView('display');
      }
    } catch (error) {
      console.error('Error saving/updating ticket:', error);
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    if (!updatedTicket.id) return;

    await updateTicket(updatedTicket.id, updatedTicket);
    if (!error) {
      setCurrentView('display');
    }
  };

  const handleEditTicket = () => {
    setCurrentView('edit');
  };

  const handleViewTicket = (ticket: Ticket) => {
    // Set the current ticket for viewing
    setCurrentTicket(ticket);
    setCurrentView('display');
  };

  const handleEditFromTable = (ticket: Ticket) => {
    // Set the current ticket for editing
    setCurrentTicket(ticket);
    setCurrentView('edit');
  };

  const handleDeleteTicket = async (id: number) => {
    await deleteTicket(id);
    // Refresh the table after deletion
    await loadAllTickets();
  };

  const handleViewAllTickets = async () => {
    await loadAllTickets();
    setCurrentView('table');
  };

  const handleCreateNewTicket = () => {
    clearCurrentTicket();
    setCurrentView('email');
  };

  const handleBackToEmail = () => {
    setCurrentView('email');
  };

  const handleBackToTable = () => {
    setCurrentView('table');
  };

  const handleCancelEdit = () => {
    if (currentTicket && currentTicket.id) {
      // If we're editing an existing ticket, go back to display view
      setCurrentView('display');
    } else {
      // If we're creating a new ticket, go back to email input
      setCurrentView('email');
    }
  };

  const NavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
  }> = ({ active, onClick, icon, label, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Ticket Email Extraction
                </h1>
                <p className="text-sm text-gray-600">
                  Extract and manage ticket information from emails
                </p>
              </div>
            </div>

            {/* Backend Health Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {isCheckingHealth ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                  ) : isBackendHealthy ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    Backend: {isBackendHealthy ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <button
                  onClick={checkBackendHealth}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Check backend health"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <NavButton
              active={currentView === 'email'}
              onClick={handleBackToEmail}
              icon={<Mail className="w-4 h-4" />}
              label="Process Email"
            />
            
            {currentTicket && (
              <NavButton
                active={currentView === 'display'}
                onClick={() => setCurrentView('display')}
                icon={<Database className="w-4 h-4" />}
                label="View Ticket"
              />
            )}
            
            {currentTicket && (
              <NavButton
                active={currentView === 'edit'}
                onClick={handleEditTicket}
                icon={<Settings className="w-4 h-4" />}
                label="Edit Ticket"
              />
            )}
            
            <NavButton
              active={currentView === 'table'}
              onClick={handleViewAllTickets}
              icon={<Database className="w-4 h-4" />}
              label="All Tickets"
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Connection Warning */}
        {isBackendHealthy === false && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Backend Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  Unable to connect to the backend server at localhost:8080. 
                  Please ensure the Spring Boot application is running.
                </p>
                <button
                  onClick={checkBackendHealth}
                  className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'email' && (
          <EmailInput
            onProcessEmail={handleProcessEmail}
            isProcessing={isProcessing}
            error={error}
            onClearError={clearError}
          />
        )}

        {currentView === 'display' && currentTicket && (
          <TicketDisplay
            ticket={currentTicket}
            onEdit={handleEditTicket}
            onSave={handleSaveTicket}
            isSaving={isSaving}
          />
        )}

        {currentView === 'edit' && currentTicket && (
          <TicketEditor
            ticket={currentTicket}
            onSave={handleSaveTicket}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        )}

        {currentView === 'table' && (
          <TicketsTable
            tickets={allTickets}
            isLoading={isLoading}
            onView={handleViewTicket}
            onEdit={handleEditFromTable}
            onDelete={handleDeleteTicket}
            onRefresh={loadAllTickets}
            onCreateNew={handleCreateNewTicket}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2025 Ticket Email Extraction System. Built with React + TypeScript + Vite.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Backend: localhost:8080</span>
              <span>•</span>
              <span>Frontend: {window.location.origin}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
