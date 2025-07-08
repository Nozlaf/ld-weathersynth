import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    
    // Store error info for rendering
    this.setState({ errorInfo });

    // Forward error to LaunchDarkly (to be overridden in subclass)
    this.trackErrorToLaunchDarkly(error, errorInfo);
  }

  protected trackErrorToLaunchDarkly(error: Error, errorInfo: ErrorInfo) {
    // Base implementation - does nothing
    // This will be overridden in the subclass
  }

  public render() {
    if (this.state.hasError) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      return (
        <div className="error-boundary" role="alert">
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
                  <p>Something went wrong. We apologize for the inconvenience.</p>
                  <p>📡 Error reported to LaunchDarkly</p>
                  <p>🔄 Please refresh the page to continue</p>
                  {!isProduction && this.state.error && (
                    <details className="error-technical">
                      <summary>Technical Details</summary>
                      <code>{this.state.error.message}</code>
                    </details>
                  )}
                </div>
                <a href="/" className="error-refresh-link">
                  <button className="error-refresh-button">
                    Refresh Page
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryWithLDProps extends Props {
  ldClient?: any;
}

class ErrorBoundaryWithLD extends ErrorBoundary {
  private ldClient: any;

  constructor(props: ErrorBoundaryWithLDProps) {
    super(props);
    this.ldClient = props.ldClient;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    
    // Store error info for rendering
    this.setState({ errorInfo });

    // Forward error to LaunchDarkly
    this.trackErrorToLaunchDarkly(error, errorInfo);
  }

  protected trackErrorToLaunchDarkly = (error: Error, errorInfo: ErrorInfo) => {
    try {
      if (this.ldClient && typeof this.ldClient.track === 'function') {
        const context = this.ldClient.getContext ? this.ldClient.getContext() : {};
        
        // Use custom componentStack from error object if available, otherwise use React's errorInfo
        const componentStack = (error as any).componentStack || errorInfo.componentStack || 'No component stack available';
        
        const trackingData: any = {
          error_message: error.message,
          error_stack: error.stack || 'Stack trace not available',
          component_stack: componentStack,
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        };

        // Only include user context if it exists
        if (context.key) trackingData.user_key = context.key;
        if (context.name) trackingData.user_name = context.name;
        if (context.email) trackingData.user_email = context.email;

        this.ldClient.track('error_boundary_triggered', trackingData);
      }
    } catch (ldError) {
      console.warn('Failed to record error in LaunchDarkly:', ldError);
    }
  };
}

// Functional component wrapper to inject LaunchDarkly client
const ErrorBoundaryWrapper = (props: Props) => {
  const ldClient = useLDClient();
  
  return React.createElement(ErrorBoundaryWithLD, {
    ...props,
    ldClient
  });
};

export default ErrorBoundaryWrapper; 