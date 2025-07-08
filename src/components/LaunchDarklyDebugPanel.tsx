import React, { useState, useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { createLDContext } from '../services/launchDarklyConfig';
import { useTheme } from '../hooks/useTheme';
import WeatherDebugService, { WeatherDebugInfo } from '../services/weatherDebugService';
import locationSimulationService from '../services/locationSimulationService';
import { LocationSimulationState } from '../types/locationSimulation';
import WeatherApiTestingModal from './WeatherApiTestingModal';
import CacheViewerModal from './CacheViewerModal';
import LocationSimulationModal from './LocationSimulationModal';
import ContextDataModal from './ContextDataModal';
import WeatherDebugModal from './WeatherDebugModal';
import FeatureFlagsModal from './FeatureFlagsModal';
import './LaunchDarklyDebugPanel.css';

// Declare LDRecord for LaunchDarkly session recording
declare global {
  interface Window {
    LDRecord?: {
      getRecordingState: () => string;
    };
    ldSessionReplay?: any;
  }
}

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const LaunchDarklyDebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onClose }) => {
  const ldClient = useLDClient();
  const { theme } = useTheme();
  const [flags, setFlags] = useState<{ [key: string]: any }>({});
  const [serverSideFlags, setServerSideFlags] = useState<{ [key: string]: any }>({});
  const [context, setContext] = useState<any>(null);
  const [sdkState, setSdkState] = useState<string>('Unknown');
  const [recordingState, setRecordingState] = useState<string>('Unknown');
  const [weatherDebugInfo, setWeatherDebugInfo] = useState<WeatherDebugInfo | null>(null);
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [locationSimulation, setLocationSimulation] = useState<LocationSimulationState>({
    isSimulating: false,
    activeLocation: null,
    presetLocations: []
  });

  // Modal state management
  const [showWeatherApiModal, setShowWeatherApiModal] = useState(false);
  const [showCacheViewerModal, setShowCacheViewerModal] = useState(false);
  const [showLocationSimulationModal, setShowLocationSimulationModal] = useState(false);
  const [showContextDataModal, setShowContextDataModal] = useState(false);
  const [showWeatherDebugModal, setShowWeatherDebugModal] = useState(false);
  const [showFeatureFlagsModal, setShowFeatureFlagsModal] = useState(false);

  // Throw error during render if triggered
  if (shouldThrowError) {
    const location = weatherDebugInfo?.location.address || 'Unknown Location';
    const userKey = context?.key || 'unknown-user';
    throw new Error(`Test error from debug panel - LaunchDarkly error tracking test | ${location} | ${userKey}`);
  }

  // Function to fetch server-side flags
  const fetchServerSideFlags = async () => {
    try {
      const currentContext = createLDContext();
      const params = new URLSearchParams({
        userKey: currentContext.key,
        userName: currentContext.name || 'Debug User',
        ...(currentContext.email && { userEmail: currentContext.email })
      });
      
      const response = await fetch(`/api/debug/weather-provider?${params}`);
      if (response.ok) {
        const data = await response.json();
        setServerSideFlags(data);
      } else {
        console.warn('Failed to fetch server-side flags:', response.status);
      }
    } catch (error) {
      console.error('Error fetching server-side flags:', error);
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    // Get SDK state
    const updateSdkState = () => {
      if (ldClient) {
        setSdkState('Connected');
        
        // Get recording state
        try {
          let state = 'Not Available';
          
          // Try multiple methods to get recording state
          if (window.LDRecord?.getRecordingState) {
            state = window.LDRecord.getRecordingState();
          } else if (window.ldSessionReplay?.getRecordingState) {
            state = window.ldSessionReplay.getRecordingState();
          } else {
            // Fallback: Check if we're likely recording based on plugin presence
            state = window.ldSessionReplay ? 'Recording (Plugin Active)' : 'Not Available';
          }
          
          setRecordingState(state);
        } catch (error) {
          console.warn('Could not get recording state:', error);
          setRecordingState('Error');
        }
        
        // Get client-side flags (excluding server-side only flags)
        try {
          const flagKeys = [
            'default-theme',
            'default-temperature',
            'default-distance',
            'weather-refresh-interval', 
            'enable-animations',
            'show-extra-weather-info',
            'debug-mode',
            'show-moon-phase',
            'enable-sakura-theme'
          ];
          
          const flagValues: { [key: string]: any } = {};
          flagKeys.forEach(key => {
            flagValues[key] = ldClient.variation(key, 'Not Set');
          });
          setFlags(flagValues);
        } catch (error) {
          console.error('Error getting flags:', error);
        }

        // Get context - try to get current context from LaunchDarkly client, fallback to creating new one
        try {
          let currentContext;
          if (ldClient && ldClient.getContext) {
            // Try to get the actual current context from the LaunchDarkly client
            currentContext = ldClient.getContext();
          } else {
            // Fallback to creating a new context
            currentContext = createLDContext();
          }
          setContext(currentContext);
        } catch (error) {
          console.warn('Could not get LaunchDarkly context:', error);
          // Fallback to creating a new context
          const currentContext = createLDContext();
          setContext(currentContext);
        }
      } else {
        setSdkState('Disconnected');
      }
    };

    // Get weather debug information
    const updateWeatherDebug = () => {
      const weatherDebug = WeatherDebugService.getInstance();
      setWeatherDebugInfo(weatherDebug.getDebugInfo());
    };

    // Get location simulation state
    const updateLocationSimulation = () => {
      setLocationSimulation(locationSimulationService.getState());
    };

    updateSdkState();
    updateWeatherDebug();
    updateLocationSimulation();
    fetchServerSideFlags(); // Fetch server-side flags

    // Subscribe to location simulation changes
    const unsubscribeLocation = locationSimulationService.subscribe(updateLocationSimulation);
    
    // Listen for flag changes
    const flagChangeHandler = () => {
      updateSdkState();
      updateWeatherDebug();
      fetchServerSideFlags(); // Re-fetch server-side flags when flags change
    };
    ldClient?.on('change', flagChangeHandler);

    return () => {
      ldClient?.off('change', flagChangeHandler);
      unsubscribeLocation();
    };
  }, [ldClient, isVisible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handler to update location simulation state
  const handleLocationSimulationUpdate = () => {
    setLocationSimulation(locationSimulationService.getState());
  };

  if (!isVisible) return null;

  return (
    <div className="debug-overlay" onClick={handleOverlayClick}>
      <div className="debug-panel">
        <div className="debug-header">
          <h2 className="debug-title">🚀 LAUNCHDARKLY DEBUG TERMINAL</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          {/* SDK Status */}
          <div className="debug-section">
            <h3>📡 SDK STATUS</h3>
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label">CONNECTION:</span>
                <span className={`info-value ${sdkState.toLowerCase()}`}>
                  {sdkState}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">CLIENT ID:</span>
                <span className="info-value">
                  {process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID || 'demo-key-placeholder'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">SDK VERSION:</span>
                <span className="info-value">launchdarkly-react-client-sdk@3.8.1</span>
              </div>
              <div className="info-row">
                <span className="info-label">OBSERVABILITY:</span>
                <span className="info-value">✅ Enabled</span>
              </div>
              <div className="info-row">
                <span className="info-label">SESSION REPLAY:</span>
                <span className="info-value">✅ Enabled</span>
              </div>
              <div className="info-row">
                <span className="info-label">CANVAS RECORDING:</span>
                <span className="info-value">✅ 2 FPS @ 480p</span>
              </div>
              <div className="info-row">
                <span className="info-label">RECORDING STATE:</span>
                <span className={`info-value ${recordingState.toLowerCase().replace(/[^a-z]/g, '')}`}>
                  {recordingState === 'Recording' ? '🔴 Recording' : 
                   recordingState === 'NotRecording' ? '⚪ Not Recording' : 
                   recordingState === 'Recording (Plugin Active)' ? '🟡 Plugin Active' :
                   `⚠️ ${recordingState}`}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">NETWORK RECORDING:</span>
                <span className="info-value">✅ Headers & Body</span>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="debug-section">
            <h3>🎛️ FEATURE FLAGS</h3>
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label">TOTAL FLAGS:</span>
                <span className="info-value">{Object.keys(flags).length}</span>
              </div>
              <div className="info-row">
                <span className="info-label">STATUS:</span>
                <span className={`info-value ${Object.keys(flags).length > 0 ? 'connected' : 'disconnected'}`}>
                  {Object.keys(flags).length > 0 ? 'Flags Available' : 'No flags (SDK not connected)'}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <button 
                  className="error-test-button"
                  onClick={() => setShowFeatureFlagsModal(true)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '2px solid #ffaa00',
                    color: '#ffaa00',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🎛️</span>
                  <span>VIEW ALL FLAGS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Theme Debug */}
          <div className="debug-section">
            <h3>🎨 THEME DEBUG</h3>
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label">CURRENT THEME:</span>
                <span className="info-value">{theme}</span>
              </div>
              <div className="info-row">
                <span className="info-label">DEFAULT-THEME FLAG:</span>
                <span className="info-value">{flags['default-theme'] || 'Not Set'}</span>
              </div>
                             <div className="info-row">
                 <span className="info-label">THEME SOURCE:</span>
                 <span className="info-value">
                   {flags['default-theme'] 
                     ? 'LaunchDarkly flag' 
                     : 'hardcoded default (dark)'}
                 </span>
               </div>
               <div className="info-row">
                 <span className="info-label">FLAG STATUS:</span>
                 <span className="info-value">
                   {flags['default-theme'] === theme 
                     ? '✅ Applied' 
                     : '⚠️ Mismatch'}
                 </span>
               </div>
            </div>
          </div>

          

          {/* Weather API Debug */}
          <div className="debug-section">
            <h3>🌤️ WEATHER API DEBUG</h3>
            <div className="debug-info">
              {weatherDebugInfo ? (
                <>
                  <div className="info-row">
                    <span className="info-label">API STATUS:</span>
                    <span className={`info-value ${weatherDebugInfo.apiKey.hasKey ? 'connected' : 'disconnected'}`}>
                      {weatherDebugInfo.apiKey.status}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">PROVIDER:</span>
                    <span className="info-value">{weatherDebugInfo.settings.provider}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">LOCATION:</span>
                    <span className="info-value">
                      {weatherDebugInfo.location.address || 'Unknown'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">PROVIDERS:</span>
                    <span className="info-value">
                      {weatherDebugInfo.weatherProviders ? 
                        `${weatherDebugInfo.weatherProviders.available.length} of ${weatherDebugInfo.weatherProviders.all.length} available` 
                        : 'Loading...'}
                    </span>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button 
                      className="error-test-button"
                      onClick={() => setShowWeatherDebugModal(true)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '2px solid #00ffff',
                        color: '#00ffff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🌤️</span>
                      <span>VIEW DETAILED DEBUG</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-context">Weather debug info not available</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="debug-section">
            <h3>⚡ QUICK ACTIONS</h3>
            <div className="debug-info">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <button 
                  className="error-test-button"
                  onClick={() => setShowContextDataModal(true)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: '2px solid #ffaa00',
                    color: '#ffaa00',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>👤</span>
                  <span>VIEW CONTEXT</span>
                </button>
                
                <button 
                  className="error-test-button"
                  onClick={() => setShowCacheViewerModal(true)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: '2px solid #00ffff',
                    color: '#00ffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>💾</span>
                  <span>VIEW CACHE</span>
                </button>
                
                <button 
                  className="error-test-button"
                  onClick={() => setShowWeatherApiModal(true)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: '2px solid #00ff00',
                    color: '#00ff00',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🧪</span>
                  <span>TEST WEATHER APIs</span>
                </button>
                
                <button 
                  className="error-test-button"
                  onClick={() => setShowLocationSimulationModal(true)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: '2px solid #ff00ff',
                    color: '#ff00ff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🌍</span>
                  <span>SIMULATE LOCATION</span>
                </button>
              </div>
            </div>
          </div>





          {/* Error Testing */}
          <div className="debug-section">
            <h3>🚨 ERROR TESTING</h3>
            <div className="debug-info">
              <div className="instructions">
                <p>• Test your ErrorBoundary and LaunchDarkly error reporting</p>
                <button 
                  className="error-test-button"
                  onClick={() => {
                    setShouldThrowError(true);
                  }}
                >
                  [ TRIGGER TEST ERROR ]
                </button>
                <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#ffaa00' }}>
                  ⚠️ This will crash the app and show the error boundary screen
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#00ffff' }}>
                  💡 Error includes location and user ID for unique tracking
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="debug-section">
            <h3>💡 INSTRUCTIONS</h3>
            <div className="debug-info">
              <div className="instructions">
                <p>• Press <kbd>Cmd+K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows/Linux) to toggle this panel</p>
                <p>• Add your LaunchDarkly Client ID to <code>.env</code> to see real flags</p>
                <p>• Create flags in your LaunchDarkly dashboard to control app behavior</p>
                <p>• Use <strong>Location Simulation</strong> to test weather in different cities worldwide</p>
                <p>• This panel shows real-time flag values and SDK connection status</p>
                <p>• Observability and Session Replay with Canvas Recording (2 FPS @ 480p) enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ContextDataModal
        isVisible={showContextDataModal}
        onClose={() => setShowContextDataModal(false)}
        context={context}
      />
      
      <WeatherApiTestingModal
        isVisible={showWeatherApiModal}
        onClose={() => setShowWeatherApiModal(false)}
        weatherDebugInfo={weatherDebugInfo}
      />
      
      <CacheViewerModal
        isVisible={showCacheViewerModal}
        onClose={() => setShowCacheViewerModal(false)}
      />
      
      <LocationSimulationModal
        isVisible={showLocationSimulationModal}
        onClose={() => setShowLocationSimulationModal(false)}
        locationSimulation={locationSimulation}
        onLocationSimulationUpdate={handleLocationSimulationUpdate}
      />
      
      <WeatherDebugModal
        isVisible={showWeatherDebugModal}
        onClose={() => setShowWeatherDebugModal(false)}
        weatherDebugInfo={weatherDebugInfo}
      />
      
      <FeatureFlagsModal
        isVisible={showFeatureFlagsModal}
        onClose={() => setShowFeatureFlagsModal(false)}
        flags={flags}
        serverSideFlags={serverSideFlags}
      />
    </div>
  );
};

export default LaunchDarklyDebugPanel; 