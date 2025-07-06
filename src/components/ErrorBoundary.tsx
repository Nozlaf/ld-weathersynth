import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Forward error to LaunchDarkly via the client's observability plugin
    try {
      // Get the LaunchDarkly client from window if available
      const ldClient = (window as any).ldClient;
      
      if (ldClient && typeof ldClient.track === 'function') {
        // Use track to send error information as a custom event
        ldClient.track('error-boundary-triggered', {
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack || 'No component stack available',
          errorBoundary: 'WeatherSynthErrorBoundary',
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
      }

      // Also try the global LDObserve if available (fallback)
      if (typeof window !== 'undefined' && (window as any).LDObserve) {
        (window as any).LDObserve.recordError(
          error.message,
          'React Error Boundary',
          { 
            componentStack: errorInfo.componentStack || 'No component stack available',
            errorBoundary: 'WeatherSynthErrorBoundary',
            timestamp: new Date().toISOString(),
            stack: error.stack,
            url: window.location.href,
          }
        );
      }
    } catch (ldError) {
      console.warn('Failed to record error in LaunchDarkly:', ldError);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-terminal">
              <div className="error-header">
                <span className="error-title">SYSTEM ERROR</span>
                <div className="error-controls">
                  <span className="control-dot red"></span>
                  <span className="control-dot yellow"></span>
                  <span className="control-dot green"></span>
                </div>
              </div>
              <div className="error-body">
                <pre className="error-ascii">
{`
█▀▀ █▀█ █▀█ █▀█ █▀█
██▄ █▀▄ █▀▄ █▄█ █▀▄

FATAL SYSTEM ERROR
`}
                </pre>
                <div className="error-details">
                  <p>🌪️ WEATHER SYNTH ENCOUNTERED AN ERROR</p>
                  <p>📡 Error reported to LaunchDarkly</p>
                  <p>🔄 Please refresh the page to continue</p>
                  {this.state.error && (
                    <details className="error-technical">
                      <summary>Technical Details</summary>
                      <code>{this.state.error.message}</code>
                    </details>
                  )}
                </div>
                <button 
                  className="error-refresh-button"
                  onClick={() => window.location.reload()}
                >
                  [ RESTART SYSTEM ]
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

export default ErrorBoundary; 