import React from 'react';
import { render, screen } from '@testing-library/react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import ErrorBoundary from '../ErrorBoundary';
import { createMockLDClient } from '../../utils/testUtils';

// Mock the LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk');
const mockUseLDClient = useLDClient as jest.MockedFunction<typeof useLDClient>;

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal component</div>;
};

// Component that throws an error with custom data
const ErrorThrowingComponentWithData = () => {
  const error = new Error('Test error with context');
  (error as any).componentStack = 'Component stack trace';
  (error as any).errorBoundary = 'ErrorBoundary';
  throw error;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders children when there are no errors', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and shows fallback UI', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/We apologize for the inconvenience/i)).toBeInTheDocument();
      expect(screen.queryByText('Normal component')).not.toBeInTheDocument();
    });

    it('displays error details in development mode', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      // Mock NODE_ENV for this test
      const originalEnv = process.env;
      process.env = { ...originalEnv, NODE_ENV: 'development' };

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Test error message/i)).toBeInTheDocument();

      process.env = originalEnv;
    });

    it('hides error details in production mode', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      // Mock NODE_ENV for this test
      const originalEnv = process.env;
      process.env = { ...originalEnv, NODE_ENV: 'production' };

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Test error message/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      process.env = originalEnv;
    });
  });

  describe('LaunchDarkly Integration', () => {
    it('tracks errors to LaunchDarkly', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockClient.track).toHaveBeenCalledWith('error_boundary_triggered', {
        error_message: 'Test error message',
        error_stack: expect.any(String),
        component_stack: expect.any(String),
        timestamp: expect.any(String),
        page_url: expect.any(String),
        user_agent: expect.any(String),
      });
    });

    it('includes user context in error tracking', () => {
      const mockClient = createMockLDClient();
      mockClient.getContext.mockReturnValue({
        key: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockClient.track).toHaveBeenCalledWith('error_boundary_triggered', 
        expect.objectContaining({
          user_key: 'test-user-123',
          user_name: 'Test User',
          user_email: 'test@example.com',
        })
      );
    });

    it('works when LaunchDarkly client is not available', () => {
      mockUseLDClient.mockReturnValue(null as any);

      expect(() => {
        render(
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error Information', () => {
    it('extracts error information correctly', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponentWithData />
        </ErrorBoundary>
      );

      expect(mockClient.track).toHaveBeenCalledWith('error_boundary_triggered', 
        expect.objectContaining({
          error_message: 'Test error with context',
          component_stack: expect.stringContaining('Component stack trace'),
        })
      );
    });

    it('handles errors without stack traces', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      const ErrorWithoutStack = () => {
        const error = new Error('Error without stack');
        delete (error as any).stack;
        throw error;
      };

      render(
        <ErrorBoundary>
          <ErrorWithoutStack />
        </ErrorBoundary>
      );

      expect(mockClient.track).toHaveBeenCalledWith('error_boundary_triggered', 
        expect.objectContaining({
          error_message: 'Error without stack',
          error_stack: 'Stack trace not available',
        })
      );
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Refresh Page/i)).toBeInTheDocument();
    });

    it('refresh button has correct href', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText(/Refresh Page/i).closest('a');
      expect(refreshButton).toHaveAttribute('href', '/');
    });
  });

  describe('Console Logging', () => {
    it('logs errors to console', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith('ErrorBoundary caught an error:', expect.any(Error));
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels in error state', () => {
      const mockClient = createMockLDClient();
      mockUseLDClient.mockReturnValue(mockClient as any);

      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });
  });
}); 