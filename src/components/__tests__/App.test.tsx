import React from 'react';
import { render } from '@testing-library/react';
import App from '../../App';

// Mock LaunchDarkly
jest.mock('launchdarkly-react-client-sdk', () => ({
  withLDProvider: (component: React.ComponentType) => component,
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
}); 