import React, { useState, useEffect, useRef } from 'react';
import { withLDProvider, useLDClient } from 'launchdarkly-react-client-sdk';
import Observability from '@launchdarkly/observability';
import SessionReplay from '@launchdarkly/session-replay';
import { ThemeProvider } from './providers/ThemeProvider';
import WeatherWidget from './components/WeatherWidget';
import LaunchDarklyDebugPanel from './components/LaunchDarklyDebugPanel';
import QRCodeDisplay from './components/QRCodeDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { getSDKKey, createLDContext } from './services/launchDarklyConfig';
import { initializeGA, trackPageView } from './utils/analytics';
import DebugService from './services/debugService';
import './App.css';

// Create session replay instance we can reference later
const sessionReplayInstance = new SessionReplay({
  privacySetting: 'none',
  enableCanvasRecording: true,
  samplingStrategy: {
    canvasManualSnapshot: 2,
    canvasMaxSnapshotDimension: 480,
  },
});

// Make session replay instance available globally for debug panel
declare global {
  interface Window {
    ldSessionReplay?: any;
    ldClient?: any;
  }
}

window.ldSessionReplay = sessionReplayInstance;

const App: React.FC = () => {
  const ldClient = useLDClient();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const debugService = DebugService.getInstance();

  // Initialize debug service with LaunchDarkly client and make ldClient available globally
  useEffect(() => {
    if (ldClient) {
      window.ldClient = ldClient;
      debugService.setLDClient(ldClient);
    }
  }, [ldClient, debugService]);

  // Initialize Google Analytics
  useEffect(() => {
    initializeGA();
    trackPageView(window.location.pathname);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowDebugPanel(prev => !prev);
      }
      // Also allow Escape to close the panel
      if (event.key === 'Escape' && showDebugPanel) {
        setShowDebugPanel(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDebugPanel]);

  // Handle tap detection for mobile secret menu
  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    const target = event.target as HTMLElement | null;
    
    // Return early if no target
    if (!target) return;
    
    // Check if tap is on any modal/menu content - exclude these taps
    const isOnModalContent = (element: HTMLElement): boolean => {
      // Check if element or any parent has these classes
      const excludedClasses = [
        'terminal-frame',      // The actual weather content box
        'terminal-content',    // Weather content inside the frame
        'debug-overlay',       // Debug panel overlay
        'debug-panel',         // Debug panel content
        'qr-code-display',     // QR code display
        'qr-code-container',   // QR code container
        'options-modal-backdrop', // Options modal backdrop
        'options-modal'        // Options modal content
      ];
      
      let current: HTMLElement | null = element;
      while (current && current !== document.body) {
        if (excludedClasses.some(className => current!.classList.contains(className))) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    };
    
    // Only count taps in empty space (not on any modal/menu content)
    if (isOnModalContent(target)) {
      debugService.log('🔍 DEBUG: Tap ignored - clicked on modal/menu content');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    // Reset tap count if more than 2 seconds between taps
    if (timeSinceLastTap > 2000) {
      setTapCount(1);
    } else {
      setTapCount(prevCount => {
        const newCount = prevCount + 1;
        debugService.log(`🔍 DEBUG: Tap count: ${newCount}/10`);
        
        // Open debug panel after 10 taps (you can change this number)
        if (newCount >= 10) {
          setShowDebugPanel(true);
          return 0; // Reset count
        }
        
        return newCount;
      });
    }
    
    lastTapTimeRef.current = now;
    
    // Clear any existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    // Reset tap count after 3 seconds of inactivity
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        <ThemeProvider>
          <div 
            onClick={(e) => handleTap(e)}
            onTouchEnd={(e) => handleTap(e)}
            style={{ 
              cursor: 'default',
              WebkitTapHighlightColor: 'transparent' // Prevent blue highlight on mobile
            }}
          >
            <WeatherWidget />
          </div>
          <QRCodeDisplay />
          <LaunchDarklyDebugPanel 
            isVisible={showDebugPanel}
            onClose={() => setShowDebugPanel(false)}
          />
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
};

// Following LaunchDarkly Cursor Rules: Initialize with proper context
const LaunchDarklyApp = withLDProvider({
  clientSideID: getSDKKey(),
  context: createLDContext(),
  timeout: 5, // Following Rule 3: Add timeout for initialization
  options: {
    bootstrap: 'localStorage',
    // Following Rule 2: Environment-aware configuration
    baseUrl: process.env.REACT_APP_LD_BASE_URL || undefined,
    streamUrl: process.env.REACT_APP_LD_STREAM_URL || undefined,
    eventsUrl: process.env.REACT_APP_LD_EVENTS_URL || undefined,
    // Plugins directly in options as per documentation
    plugins: [
      new Observability({
        networkRecording: {
          enabled: true,
          recordHeadersAndBody: true
        }
      }),
      sessionReplayInstance
    ],
  }
})(App);

export default LaunchDarklyApp;
