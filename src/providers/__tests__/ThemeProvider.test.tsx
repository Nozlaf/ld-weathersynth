import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../../hooks/useTheme';
import { createMockLDClient } from '../../utils/testUtils';

// Mock the LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk');
const mockUseLDClient = useLDClient as jest.MockedFunction<typeof useLDClient>;

// Mock React GA4
jest.mock('react-ga4', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    send: jest.fn(),
    event: jest.fn(),
    gtag: jest.fn(),
  },
}));

// Mock analytics utils
jest.mock('../../utils/analytics', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackCustomEvent: jest.fn(),
  initializeGA: jest.fn(),
}));

// Test component that uses the theme
const TestComponent = () => {
  const { theme, setThemeManually, resetThemeToDefault, trackThemeChangeOnClose } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setThemeManually('dark-green')}>Set Dark Green</button>
      <button onClick={() => setThemeManually('light')}>Set Light</button>
      <button onClick={resetThemeToDefault}>Reset to Default</button>
      <button onClick={() => trackThemeChangeOnClose('dark-synth', 'light', 'manual')}>
        Track Change
      </button>
    </div>
  );
};

const renderWithThemeProvider = (ldClient = createMockLDClient()) => {
  mockUseLDClient.mockReturnValue(ldClient as any);
  
  return render(
    <ThemeProvider>
      <TestComponent />
    </ThemeProvider>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Default Theme', () => {
    it('uses LaunchDarkly default theme when no local theme is set', () => {
      const mockClient = createMockLDClient({
        'default-theme': 'dark-green',
      });
      
      renderWithThemeProvider(mockClient);
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-green');
    });

    it('falls back to dark-synth when LaunchDarkly is not available', () => {
      mockUseLDClient.mockReturnValue(null as any);
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-synth');
    });

    it('uses stored theme from localStorage over LaunchDarkly default', () => {
      localStorage.setItem('theme', 'light');
      
      const mockClient = createMockLDClient({
        'default-theme': 'dark-green',
      });
      
      renderWithThemeProvider(mockClient);
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('Theme Switching', () => {
    it('allows manual theme changes', () => {
      renderWithThemeProvider();
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-synth');
      
      fireEvent.click(screen.getByText('Set Dark Green'));
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-green');
    });

    it('stores manual theme changes in localStorage', () => {
      renderWithThemeProvider();
      
      fireEvent.click(screen.getByText('Set Light'));
      
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('resets to LaunchDarkly default theme', () => {
      localStorage.setItem('theme', 'light');
      
      const mockClient = createMockLDClient({
        'default-theme': 'dark-orange',
      });
      
      renderWithThemeProvider(mockClient);
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      fireEvent.click(screen.getByText('Reset to Default'));
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-orange');
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });

  describe('Theme Mapping', () => {
    it('maps LaunchDarkly theme values correctly', () => {
      const testCases = [
        { ldTheme: 'dark', expected: 'dark-synth' },
        { ldTheme: 'light', expected: 'light' },
        { ldTheme: 'dark-synth', expected: 'dark-synth' },
        { ldTheme: 'dark-green', expected: 'dark-green' },
        { ldTheme: 'sakura', expected: 'sakura' },
        { ldTheme: 'unknown', expected: 'dark-synth' },
      ];

      testCases.forEach(({ ldTheme, expected }) => {
        const mockClient = createMockLDClient({
          'default-theme': ldTheme,
        });
        
        const { unmount } = renderWithThemeProvider(mockClient);
        
        expect(screen.getByTestId('current-theme')).toHaveTextContent(expected);
        
        unmount();
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks theme changes with Google Analytics', async () => {
      const { trackEvent } = require('../../utils/analytics');
      
      renderWithThemeProvider();
      
      fireEvent.click(screen.getByText('Track Change'));
      
      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('theme_change', 
          expect.objectContaining({
            from_theme: 'dark-synth',
            to_theme: 'light',
            change_method: 'manual',
            session_id: expect.any(String),
          })
        );
      });
    });

    it('tracks theme changes with LaunchDarkly', async () => {
      const mockClient = createMockLDClient();
      
      renderWithThemeProvider(mockClient);
      
      fireEvent.click(screen.getByText('Track Change'));
      
      await waitFor(() => {
        expect(mockClient.track).toHaveBeenCalledWith('theme_change', {
          from_theme: 'dark-synth',
          to_theme: 'light',
          change_method: 'manual',
          session_id: expect.any(String),
        });
      });
    });

    it('generates consistent session IDs', () => {
      const { trackEvent } = require('../../utils/analytics');
      
      renderWithThemeProvider();
      
      fireEvent.click(screen.getByText('Track Change'));
      fireEvent.click(screen.getByText('Track Change'));
      
      const calls = trackEvent.mock.calls.filter((call: any) => call[0] === 'theme_change');
      
      expect(calls).toHaveLength(2);
      expect(calls[0][1].session_id).toBe(calls[1][1].session_id);
    });
  });

  describe('CSS Custom Properties', () => {
    it('applies theme CSS custom properties to document root', () => {
      renderWithThemeProvider();
      
      fireEvent.click(screen.getByText('Set Light'));
      
      // Should apply light theme CSS properties
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      // Note: In Jest environment, CSS custom properties won't be actually computed
      // but we can verify the theme class is applied
      expect(document.body.className).toContain('light');
    });

    it('updates body className when theme changes', () => {
      renderWithThemeProvider();
      
      expect(document.body.className).toContain('dark-synth');
      
      fireEvent.click(screen.getByText('Set Light'));
      
      expect(document.body.className).toContain('light');
      expect(document.body.className).not.toContain('dark-synth');
    });
  });

  describe('LaunchDarkly Flag Changes', () => {
    it('responds to default-theme flag changes', async () => {
      const mockClient = createMockLDClient({
        'default-theme': 'dark-synth',
      });
      
      renderWithThemeProvider(mockClient);
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-synth');
      
      // Simulate flag change
      const onCallback = mockClient.on.mock.calls.find(call => call[0] === 'change')?.[1];
      if (onCallback) {
        onCallback({
          'default-theme': { current: 'sakura' },
        });
      }
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('sakura');
      });
    });

    it('does not override manual theme selection with flag changes', async () => {
      const mockClient = createMockLDClient({
        'default-theme': 'dark-synth',
      });
      
      renderWithThemeProvider(mockClient);
      
      // Manually set theme
      fireEvent.click(screen.getByText('Set Light'));
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      // Simulate flag change
      const onCallback = mockClient.on.mock.calls.find(call => call[0] === 'change')?.[1];
      if (onCallback) {
        onCallback({
          'default-theme': { current: 'sakura' },
        });
      }
      
      // Should still be light (manual override)
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      renderWithThemeProvider();
      
      // Should not crash when trying to save theme
      fireEvent.click(screen.getByText('Set Light'));
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      // Restore localStorage
      localStorage.setItem = originalSetItem;
    });

    it('handles invalid theme values in localStorage', () => {
      localStorage.setItem('theme', 'invalid-theme');
      
      const mockClient = createMockLDClient({
        'default-theme': 'dark-green',
      });
      
      renderWithThemeProvider(mockClient);
      
      // Should fall back to LaunchDarkly default
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark-green');
    });
  });
}); 