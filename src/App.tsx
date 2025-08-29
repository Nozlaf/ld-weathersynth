import React, { useState, useEffect, useRef } from 'react';
import { withLDProvider, useLDClient } from 'launchdarkly-react-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
import type { RecordOptions } from 'highlight.run';
import WeatherWidget from './components/WeatherWidget';
import ErrorBoundary from './components/ErrorBoundary';
import ConsentWarning from './components/ConsentWarning';
import LaunchDarklyDebugPanel from './components/LaunchDarklyDebugPanel';
import { ThemeProvider } from './providers/ThemeProvider';
import './App.css';

declare global {
  interface Window {
    showDebugPanel?: () => void;
    hideDebugPanel?: () => void;
    LDRecord?: {
      getRecordingState: () => string;
    };
    ldSessionReplay?: any;
  }
}

// Inner component that can use LaunchDarkly hooks
const AppContent: React.FC = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTapTimeRef = useRef<number>(0);
  const ldClient = useLDClient();

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowDebugPanel(!showDebugPanel);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebugPanel]);

  // Handle tap detection
  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap > 500) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }

    lastTapTimeRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 500);

    if (tapCount + 1 >= 10) {
      setShowDebugPanel(true);
      setTapCount(0);
    }
  };

  // Expose debug panel controls globally
  useEffect(() => {
    window.showDebugPanel = () => setShowDebugPanel(true);
    window.hideDebugPanel = () => setShowDebugPanel(false);
  }, []);

  // Expose session replay status
  useEffect(() => {
    // Check status after a short delay to allow initialization
    const checkSessionReplay = () => {
      const replay = window.ldSessionReplay;
      if (replay && typeof replay.getStatus === 'function') {
        console.log('Session Replay Status:', replay.getStatus());
        if (typeof replay.getSessionUrl === 'function') {
          try {
            const sessionUrl = replay.getSessionUrl();
            console.log('Session Replay URL:', sessionUrl);
          } catch (error) {
            console.log('Session URL not available yet');
          }
        }
      } else {
        console.log('Session Replay not initialized');
      }
    };

    // Try a few times with increasing delays
    setTimeout(checkSessionReplay, 1000);
    setTimeout(checkSessionReplay, 2000);
    setTimeout(checkSessionReplay, 5000);
  }, []);

  const handleConsentAccept = () => {
    console.log('User accepted LaunchDarkly data collection');
  };

  const handleConsentReject = () => {
    window.location.href = 'https://launchdarkly.com';
  };

  // Check if we should show the consent warning based on the warnusers feature flag
  const shouldShowConsentWarning = ldClient ? ldClient.variation('warnusers', true) : true;

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div onClick={handleTap} style={{ minHeight: '100vh' }}>
          {shouldShowConsentWarning && (
            <ConsentWarning
              onAccept={handleConsentAccept}
              onReject={handleConsentReject}
            />
          )}
          <WeatherWidget />
          {showDebugPanel && (
            <LaunchDarklyDebugPanel isVisible={showDebugPanel} onClose={() => setShowDebugPanel(false)} />
          )}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

// Wrapper component for withLDProvider
const App: React.FC = () => {
  return <AppContent />;
};

export default withLDProvider({
  clientSideID: process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID || 'your-client-id',
  context: {
    kind: 'user',
    key: 'anonymous',
    name: 'Anonymous User',
    custom: {
      isAnonymous: true
    }
  },
  options: {
    bootstrap: 'localStorage',
    plugins: [
      new Observability(),
      new SessionReplay({
        networkRecording: {
          enabled: true,
          recordHeadersAndBody: true,
          urlBlocklist: [],
          urlAllowlist: [window.location.origin]
        },
        maskTextContent: true,
        maskInputs: true,
        blockClass: 'private',
        blockSelector: '[data-private]'
      } as RecordOptions)
    ]
  }
})(App);
