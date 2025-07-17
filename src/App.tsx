import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Mail, Database, Settings, RefreshCw, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

import { EmailInput } from './components/EmailInput';
import { TicketDisplay } from './components/TicketDisplay';
import { TicketEditor } from './components/TicketEditor';
import { TicketsTable } from './components/TicketsTable';
import { ConsolidateTable } from './components/ConsolidateTable';
import { useTicket } from './hooks/useTicket';
import type { Ticket } from './types/ticket';
import { generateMessageId } from './utils/validation';
import { ticketService } from './services/ticketService';

type ViewMode = 'email' | 'display' | 'edit' | 'table' | 'consolidate';

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
    resetSavingState,
  } = useTicket();

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Reset saving state when switching to edit view
  useEffect(() => {
    if (currentView === 'edit') {
      resetSavingState();
    }
  }, [currentView, resetSavingState]);

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
    try {
      console.log('handleProcessEmail called with:', emailText.substring(0, 100) + '...');
      await processEmailText(emailText);
      console.log('processEmailText completed, error:', error, 'currentTicket:', currentTicket);
      if (!error) {
        console.log('Switching to display view');
        setCurrentView('display');
      } else {
        console.log('Staying on email view due to error:', error);
      }
    } catch (error) {
      console.error('Error processing email:', error);
      // Stay on email view if there's an error
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
    console.log('handleEditTicket called, resetting saving state');
    resetSavingState();
    setCurrentView('edit');
  };

  const handleViewTicket = (ticket: Ticket) => {
    // Set the current ticket for viewing
    console.log('Viewing ticket:', ticket);
    clearError();
    setCurrentTicket(ticket);
    setCurrentView('display');
  };

  const handleEditFromTable = (ticket: Ticket) => {
    // Set the current ticket for editing
    console.log('handleEditFromTable called, resetting saving state');
    clearError();
    setCurrentTicket(ticket);
    resetSavingState();
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

  const handleViewConsolidate = () => {
    setCurrentView('consolidate');
  };

  const handleCreateNewTicket = () => {
    clearCurrentTicket();
    setCurrentView('email');
  };

  const handleBackToEmail = () => {
    clearError();
    setCurrentView('email');
  };

  const handleBackToTable = () => {
    setCurrentView('table');
  };

  const handleCancelEdit = () => {
    resetSavingState();
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
      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover-lift ${
        active
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg glow-effect'
          : 'bg-white text-secondary-700 hover:bg-secondary-50 border-2 border-secondary-200 hover:border-secondary-300 shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen warm-gradient">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
          },
        }}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-white via-primary-50 to-secondary-50 shadow-xl border-b-2 border-primary-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg glow-effect pulse-warm">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Ticket Email Extraction
                </h1>
                <p className="text-sm text-secondary-600 font-medium">
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
      <nav className="bg-gradient-to-r from-secondary-50 to-primary-50 border-b-2 border-secondary-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-6">
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
            
            <NavButton
              active={currentView === 'consolidate'}
              onClick={handleViewConsolidate}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Consolidate"
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

        {currentView === 'display' && (
          currentTicket ? (
            <TicketDisplay
              ticket={currentTicket}
              onEdit={handleEditTicket}
              onSave={handleSaveTicket}
              onBack={handleBackToTable}
              isSaving={isSaving}
            />
          ) : (
            <div className="card animate-slide-up">
              <div className="card-body">
                <div className="text-center py-12">
                  <p className="text-gray-600">No ticket selected for viewing.</p>
                  <button
                    onClick={handleBackToTable}
                    className="mt-4 btn-primary"
                  >
                    Back to All Tickets
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {currentView === 'edit' && (
          currentTicket ? (
            <TicketEditor
              ticket={currentTicket}
              onSave={handleSaveTicket}
              onCancel={handleCancelEdit}
              onBack={handleBackToTable}
              isSaving={isSaving}
            />
          ) : (
            <div className="card animate-slide-up">
              <div className="card-body">
                <div className="text-center py-12">
                  <p className="text-gray-600">No ticket selected for editing.</p>
                  <button
                    onClick={handleBackToTable}
                    className="mt-4 btn-primary"
                  >
                    Back to All Tickets
                  </button>
                </div>
              </div>
            </div>
          )
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

        {currentView === 'consolidate' && (
          <ConsolidateTable />
        )}

        {/* Fallback for unknown view states */}
        {!['email', 'display', 'edit', 'table', 'consolidate'].includes(currentView) && (
          <div className="card animate-slide-up">
            <div className="card-body">
              <div className="text-center py-12">
                <p className="text-gray-600">Something went wrong. Please try again.</p>
                <button
                  onClick={handleBackToEmail}
                  className="mt-4 btn-primary"
                >
                  Back to Email Processing
                </button>
              </div>
            </div>
          </div>
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
