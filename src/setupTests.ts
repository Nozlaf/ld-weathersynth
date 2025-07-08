// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: () => {},
  watchPosition: () => {},
  clearWatch: () => {},
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock fetch
global.fetch = () => Promise.resolve({
  json: () => Promise.resolve({}),
}) as Promise<Response>;

// Mock localStorage with actual storage functionality
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock LaunchDarkly ES modules that cause Jest parsing errors
jest.mock('@launchdarkly/observability', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    initialize: jest.fn(),
    flush: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@launchdarkly/session-replay', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    initialize: jest.fn(),
    flush: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock QRCode module
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

// Mock react-ga4
jest.mock('react-ga4', () => ({
  gtag: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
  event: jest.fn(),
}));

// Mock LaunchDarkly React SDK
jest.mock('launchdarkly-react-client-sdk', () => ({
  withLDProvider: (config: any) => (Component: any) => Component,
  useLDClient: jest.fn(() => ({
    variation: jest.fn(),
    allFlags: jest.fn(() => ({})),
    on: jest.fn(),
    off: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    flush: jest.fn(),
    close: jest.fn(),
  })),
  useFlags: jest.fn(() => ({})),
})); 