import React, { useState, useEffect } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { createLDContext } from '../services/launchDarklyConfig';
import { useTheme } from '../hooks/useTheme';
import WeatherDebugService, { WeatherDebugInfo } from '../services/weatherDebugService';
import locationSimulationService from '../services/locationSimulationService';
import { LocationSimulationState } from '../types/locationSimulation';
import { getCachedWeatherData } from '../services/weatherService';
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
  const [cachedWeatherData, setCachedWeatherData] = useState<any>(null);
  const [loadingCachedWeather, setLoadingCachedWeather] = useState(false);
  const [cachedWeatherError, setCachedWeatherError] = useState<string | null>(null);

  // Throw error during render if triggered
  if (shouldThrowError) {
    const location = weatherDebugInfo?.location.address || 'Unknown Location';
    const userKey = context?.key || 'unknown-user';
    throw new Error(`Test error from debug panel - LaunchDarkly error tracking test | ${location} | ${userKey}`);
  }

  useEffect(() => {
    if (!ldClient || !isVisible) return;

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
        
        // Get all flags
        try {
          const flagKeys = [
            'default-theme',
            'default-temperature',
            'default-distance',
            'weather-refresh-interval', 
            'enable-animations',
            'show-extra-weather-info',
            'debug-mode'
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

    // Subscribe to location simulation changes
    const unsubscribeLocation = locationSimulationService.subscribe(updateLocationSimulation);
    
    // Listen for flag changes
    const flagChangeHandler = () => {
      updateSdkState();
      updateWeatherDebug();
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

  const handleViewCachedWeather = async () => {
    setLoadingCachedWeather(true);
    setCachedWeatherError(null);
    
    try {
      const cachedData = await getCachedWeatherData();
      setCachedWeatherData(cachedData);
    } catch (error) {
      setCachedWeatherError(error instanceof Error ? error.message : 'Failed to fetch cached weather data');
      setCachedWeatherData(null);
    } finally {
      setLoadingCachedWeather(false);
    }
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
              {Object.entries(flags).map(([key, value]) => (
                <div key={key} className="info-row">
                  <span className="info-label">{key.toUpperCase()}:</span>
                  <span className="info-value flag-value">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
              {Object.keys(flags).length === 0 && (
                <div className="info-row">
                  <span className="info-value no-flags">No flags available (SDK not connected)</span>
                </div>
              )}
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

          {/* Context Data */}
          <div className="debug-section">
            <h3>👤 CONTEXT DATA</h3>
            <div className="debug-info">
              {context ? (
                <>
                  <div className="info-row">
                    <span className="info-label">KIND:</span>
                    <span className="info-value">{context.kind}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">KEY:</span>
                    <span className="info-value">{context.key}</span>
                  </div>
                  
                  {/* Standard User Attributes */}
                  {context.name && (
                    <div className="info-row">
                      <span className="info-label">NAME:</span>
                      <span className="info-value">{context.name}</span>
                    </div>
                  )}
                  {context.email && (
                    <div className="info-row">
                      <span className="info-label">EMAIL:</span>
                      <span className="info-value">{context.email}</span>
                    </div>
                  )}
                  {context.avatar && (
                    <div className="info-row">
                      <span className="info-label">AVATAR:</span>
                      <span className="info-value">{context.avatar}</span>
                    </div>
                  )}
                  {context.firstName && (
                    <div className="info-row">
                      <span className="info-label">FIRST NAME:</span>
                      <span className="info-value">{context.firstName}</span>
                    </div>
                  )}
                  {context.lastName && (
                    <div className="info-row">
                      <span className="info-label">LAST NAME:</span>
                      <span className="info-value">{context.lastName}</span>
                    </div>
                  )}
                  {context.ip && (
                    <div className="info-row">
                      <span className="info-label">IP ADDRESS:</span>
                      <span className="info-value">{context.ip}</span>
                    </div>
                  )}
                  {context.country && (
                    <div className="info-row">
                      <span className="info-label">COUNTRY:</span>
                      <span className="info-value">{context.country}</span>
                    </div>
                  )}
                  
                  {/* Custom Attributes */}
                  {context.custom && Object.keys(context.custom).length > 0 && (
                    <>
                      <div className="info-row" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                        <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>CUSTOM ATTRIBUTES:</span>
                        <span className="info-value"></span>
                      </div>
                      
                      {/* System Attributes */}
                      {context.custom.buildVersion && (
                        <div className="info-row">
                          <span className="info-label">BUILD VERSION:</span>
                          <span className="info-value">{context.custom.buildVersion}</span>
                        </div>
                      )}
                      {context.custom.sessionId && (
                        <div className="info-row">
                          <span className="info-label">SESSION ID:</span>
                          <span className="info-value">{context.custom.sessionId}</span>
                        </div>
                      )}
                      {context.custom.environment && (
                        <div className="info-row">
                          <span className="info-label">ENVIRONMENT:</span>
                          <span className="info-value">{context.custom.environment}</span>
                        </div>
                      )}
                      
                      {/* Location Attributes */}
                      {context.custom.city && (
                        <div className="info-row">
                          <span className="info-label">CITY:</span>
                          <span className="info-value">🏙️ {context.custom.city}</span>
                        </div>
                      )}
                      {context.custom.country && (
                        <div className="info-row">
                          <span className="info-label">COUNTRY CODE:</span>
                          <span className="info-value">🌍 {context.custom.country}</span>
                        </div>
                      )}
                      {context.custom.location && (
                        <div className="info-row">
                          <span className="info-label">FULL LOCATION:</span>
                          <span className="info-value">📍 {context.custom.location}</span>
                        </div>
                      )}
                      
                                             {/* Weather Attributes */}
                       <div className="info-row">
                         <span className="info-label">NIGHT TIME:</span>
                         <span className="info-value">{context.custom.night_time ? '🌙 Yes' : '☀️ No'}</span>
                       </div>
                      
                      {/* Dynamic Custom Attributes - Show any other custom attributes that aren't already displayed */}
                      {Object.entries(context.custom).map(([key, value]) => {
                        // Skip attributes we've already displayed
                        const skipKeys = ['buildVersion', 'sessionId', 'environment', 'city', 'country', 'location', 'night_time'];
                        if (skipKeys.includes(key)) return null;
                        
                        // Format the value for display
                        let displayValue = value;
                        if (typeof value === 'boolean') {
                          displayValue = value ? '✅ True' : '❌ False';
                        } else if (typeof value === 'object' && value !== null) {
                          displayValue = JSON.stringify(value, null, 2);
                        } else if (value === null || value === undefined) {
                          displayValue = 'N/A';
                        }
                        
                        return (
                          <div key={key} className="info-row">
                            <span className="info-label">{key.toUpperCase().replace(/_/g, ' ')}:</span>
                            <span className="info-value">{String(displayValue)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-context">No context available</span>
                </div>
              )}
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
                    <span className="info-label">LOCATION METHOD:</span>
                    <span className="info-value">
                      {weatherDebugInfo.location.method}
                      {weatherDebugInfo.location.fallbackUsed && ' (Fallback)'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">COORDINATES:</span>
                    <span className="info-value">
                      {weatherDebugInfo.location.coordinates 
                        ? `${weatherDebugInfo.location.coordinates.lat.toFixed(4)}, ${weatherDebugInfo.location.coordinates.lon.toFixed(4)}`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">RESOLVED LOCATION:</span>
                    <span className="info-value">
                      {weatherDebugInfo.location.address || 'Unknown'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">LAST REQUEST:</span>
                    <span className="info-value">
                      {weatherDebugInfo.lastRequest.timestamp 
                        ? `${weatherDebugInfo.lastRequest.status} (${Math.floor((Date.now() - weatherDebugInfo.lastRequest.timestamp.getTime()) / 60000)}m ago)`
                        : 'No requests yet'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">RESPONSE TIME:</span>
                    <span className="info-value">
                      {weatherDebugInfo.lastRequest.responseTime !== undefined 
                        ? `${weatherDebugInfo.lastRequest.responseTime}ms`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">UPDATE INTERVAL:</span>
                    <span className="info-value">
                      {weatherDebugInfo.settings.updateInterval} minutes
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">API URL:</span>
                    <span className="info-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {weatherDebugInfo.lastRequest.url || 'No requests made'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-context">Weather debug info not available</span>
                </div>
              )}
              
              {/* Cached Weather Data Section */}
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                <div className="info-row">
                  <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>SERVER CACHE:</span>
                  <button 
                    className="error-test-button"
                    onClick={handleViewCachedWeather}
                    disabled={loadingCachedWeather}
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      minWidth: '120px',
                      backgroundColor: 'transparent',
                      border: '2px solid #00ffff',
                      color: '#00ffff'
                    }}
                  >
                    {loadingCachedWeather ? '[ LOADING... ]' : '[ VIEW CACHE ]'}
                  </button>
                </div>
                
                {cachedWeatherError && (
                  <div className="info-row">
                    <span className="info-label">ERROR:</span>
                    <span className="info-value" style={{ color: '#ff4444' }}>
                      {cachedWeatherError}
                    </span>
                  </div>
                )}
                
                {cachedWeatherData && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="info-row">
                      <span className="info-label">CACHE STATUS:</span>
                      <span className="info-value" style={{ color: '#00ff00' }}>
                        ✅ Data Retrieved
                      </span>
                    </div>
                    
                    {/* Display cached data in a readable format */}
                    <div style={{ 
                      background: 'rgba(0, 255, 255, 0.05)', 
                      border: '1px solid rgba(0, 255, 255, 0.2)', 
                      borderRadius: '8px', 
                      padding: '10px', 
                      marginTop: '10px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.75rem', 
                        color: '#00ffff', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(cachedWeatherData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Simulation */}
          <div className="debug-section">
            <h3>🌍 LOCATION SIMULATION</h3>
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label">STATUS:</span>
                <span className={`info-value ${locationSimulation.isSimulating ? 'connected' : 'disconnected'}`}>
                  {locationSimulation.isSimulating ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>
              {locationSimulation.activeLocation && (
                <div className="info-row">
                  <span className="info-label">SIMULATING:</span>
                  <span className="info-value">
                    {locationSimulation.activeLocation.emoji} {locationSimulation.activeLocation.displayName}
                  </span>
                </div>
              )}
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.85rem', color: '#00ffff', marginBottom: '10px' }}>
                  Select a location to simulate:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {locationSimulation.presetLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      className={`error-test-button ${
                        locationSimulation.activeLocation?.id === location.id ? 'active' : ''
                      }`}
                      onClick={() => {
                        try {
                          console.log(`🔍 DEBUG: Location simulation button clicked for ${location.id}`);
                          locationSimulationService.toggleSimulation(location.id);
                          console.log(`🔍 DEBUG: toggleSimulation completed successfully`);
                          // Weather widget will automatically refresh via subscription
                        } catch (error) {
                          console.error(`🔍 DEBUG: Error in location simulation button click:`, error);
                          alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
                        }
                      }}
                      style={{
                        fontSize: '0.75rem',
                        padding: '8px 12px',
                        backgroundColor: locationSimulation.activeLocation?.id === location.id 
                          ? '#ff00ff' : 'transparent',
                        color: locationSimulation.activeLocation?.id === location.id 
                          ? '#000' : '#ff00ff'
                      }}
                    >
                      {location.emoji} {location.name}
                    </button>
                  ))}
                </div>
                {locationSimulation.isSimulating && (
                  <button
                    type="button"
                    className="error-test-button"
                    onClick={() => {
                      try {
                        console.log('🔍 DEBUG: Stop simulation button clicked');
                        locationSimulationService.stopSimulation();
                        console.log('🔍 DEBUG: stopSimulation completed successfully');
                        // Weather widget will automatically refresh via subscription
                                             } catch (error) {
                         console.error('🔍 DEBUG: Error in stop simulation button click:', error);
                         alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
                       }
                    }}
                    style={{
                      marginTop: '10px',
                      backgroundColor: '#ff0000',
                      color: '#fff',
                      borderColor: '#ff0000'
                    }}
                  >
                    [ STOP SIMULATION ]
                  </button>
                )}
                <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#ffaa00' }}>
                  💡 Location changes will update weather data automatically
                </p>
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
    </div>
  );
};

export default LaunchDarklyDebugPanel; 