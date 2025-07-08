import React from 'react';
import { render } from '@testing-library/react';
import App from '../../App';

// Mock LaunchDarkly
jest.mock('launchdarkly-react-client-sdk', () => ({
  withLDProvider: (config: any) => (component: React.ComponentType) => component,
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
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
}); 