import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full">
            <div className="card-body text-center space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>

              {/* Show detailed error info in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </p>
                  <details className="text-xs text-red-600">
                    <summary className="cursor-pointer font-medium mb-1">Stack Trace</summary>
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-600 mt-2">
                      <summary className="cursor-pointer font-medium mb-1">Component Stack</summary>
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};