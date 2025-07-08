import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../providers/ThemeProvider';

// Mock LaunchDarkly client
export const createMockLDClient = (variations: Record<string, any> = {}) => ({
  variation: jest.fn((key: string, defaultValue: any) => {
    return variations[key] !== undefined ? variations[key] : defaultValue;
  }),
  on: jest.fn(),
  off: jest.fn(),
  getContext: jest.fn(() => ({
    key: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
  })),
  track: jest.fn(),
});

// Mock weather data
export const mockWeatherData = {
  temperature: 22,
  description: 'Clear sky',
  location: 'New York, NY',
  humidity: 65,
  windSpeed: 12,
  icon: '01d',
};

// Mock API error
export const mockApiError = {
  type: 'API_KEY_INVALID' as const,
  message: 'Invalid API key',
  code: 401,
  provider: 'openweathermap',
  timestamp: new Date().toISOString(),
};

// Mock geolocation success
export const mockGeolocationSuccess = (coords = { latitude: 40.7128, longitude: -74.0060 }) => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords,
        timestamp: Date.now(),
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };
  
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });
  
  return mockGeolocation;
};

// Mock geolocation error
export const mockGeolocationError = (error = { code: 1, message: 'Permission denied' }) => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn((success, errorCallback) => {
      errorCallback(error);
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };
  
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });
  
  return mockGeolocation;
};

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

export const mockFetchError = (error: string, status = 500) => {
  global.fetch = jest.fn().mockRejectedValue(new Error(error));
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  
  return mockStorage;
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  ldClient?: any;
  initialTheme?: string;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { ldClient = createMockLDClient(), initialTheme = 'dark-synth', ...renderOptions } = options;
  
  // Mock the LaunchDarkly hook
  const mockUseLDClient = jest.fn(() => ldClient);
  
  // Mock the module
  jest.doMock('launchdarkly-react-client-sdk', () => ({
    useLDClient: mockUseLDClient,
    withLDProvider: (Component: React.ComponentType) => Component,
    useFlags: jest.fn(() => ({})),
  }));
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    );
  };
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    ldClient,
    mockUseLDClient,
  };
};

// Wait for async operations
export const waitForAsyncOperations = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock console methods
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  return {
    mockLog: console.log as jest.MockedFunction<typeof console.log>,
    mockWarn: console.warn as jest.MockedFunction<typeof console.warn>,
    mockError: console.error as jest.MockedFunction<typeof console.error>,
    restoreConsole: () => {
      global.console = originalConsole;
    },
  };
};

// Mock window.matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock timers
export const mockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceTimersByTime: jest.advanceTimersByTime,
    runOnlyPendingTimers: jest.runOnlyPendingTimers,
    runAllTimers: jest.runAllTimers,
    restoreTimers: jest.useRealTimers,
  };
}; 