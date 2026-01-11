/**
 * ERROR BOUNDARY
 * 
 * Catches component crashes and gracefully recovers.
 * Never suppresses voice.speak() calls.
 * Maintains system state for recovery.
 * 
 * Recovery strategy:
 * 1. Log error
 * 2. Announce via voice
 * 3. Reset to IDLE state
 * 4. Offer retry or reload
 */

import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useSystemState } from '../../services/SystemStateStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  recoveryAttempts: number;
}

/**
 * Error fallback UI
 */
const ErrorFallbackUI: React.FC<{ error: Error | null; onRetry: () => void; onReload: () => void }> = ({
  error,
  onRetry,
  onReload,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-red-600 mb-2">⚠ Something went wrong</h2>

        <p className="text-sm text-gray-600 mb-4">
          The application encountered an unexpected error. The system is attempting to recover.
        </p>

        {error && (
          <details className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-700">
            <summary className="font-semibold cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.toString()}</pre>
          </details>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors"
            aria-label="Retry operation"
          >
            Retry
          </button>
          <button
            onClick={onReload}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 transition-colors"
            aria-label="Reload page"
          >
            Reload
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          If the problem persists, please refresh the page or contact support.
        </p>
      </div>
    </div>
  );
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    this.setState({
      errorInfo,
      isRecovering: true,
    });

    // Attempt voice announcement
    this.announceError();

    // Reset system state to IDLE
    this.resetSystemState();

    // Log to external service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private announceError = () => {
    try {
      // Use Web Speech API directly to ensure voice still works
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(
        'An error occurred. The system is attempting to recover. Please wait.'
      );
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      synth.speak(utterance);
    } catch (e) {
      console.error('Failed to announce error via voice:', e);
    }
  };

  private resetSystemState = async () => {
    try {
      // Reset system state to IDLE
      // This is done via direct dispatch to avoid component rendering during error
      const event = new CustomEvent('systemStateReset', {
        detail: { state: 'IDLE', errorContext: null },
      });
      window.dispatchEvent(event);

      // Small delay before recovery UI
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.setState({ isRecovering: false });
    } catch (e) {
      console.error('Failed to reset system state:', e);
    }
  };

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    console.log('Error logged:', errorData);

    // Uncomment to send to external service:
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
  };

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          <ErrorFallbackUI
            error={this.state.error}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
          {this.props.fallbackUI}
        </>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for use within functional components
 */
export const useErrorRecovery = () => {
  const recoverFromError = useSystemState((s: any) => s.recoverFromError);

  const handleError = React.useCallback(
    (error: Error) => {
      console.error('Error caught by hook:', error);
      try {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance('An error occurred. Recovering.');
        synth.speak(utterance);
      } catch (e) {
        console.error('Failed to announce error:', e);
      }
      recoverFromError();
    },
    [recoverFromError]
  );

  return { handleError };
};

export default ErrorBoundary;
