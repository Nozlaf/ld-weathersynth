import React, { useState } from 'react';
import { WeatherDebugInfo } from '../services/weatherDebugService';

interface WeatherProviderTestResult {
  provider: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime?: number;
  timestamp: Date;
}

interface WeatherApiTestingModalProps {
  isVisible: boolean;
  onClose: () => void;
  weatherDebugInfo: WeatherDebugInfo | null;
}

const WeatherApiTestingModal: React.FC<WeatherApiTestingModalProps> = ({ 
  isVisible, 
  onClose, 
  weatherDebugInfo 
}) => {
  const [weatherTestResults, setWeatherTestResults] = useState<WeatherProviderTestResult[]>([]);
  const [testingWeatherProviders, setTestingWeatherProviders] = useState<string[]>([]);
  const [testingAllProviders, setTestingAllProviders] = useState(false);

  // Weather API testing handlers
  const testWeatherProvider = async (provider: string) => {
    if (testingWeatherProviders.includes(provider)) return;
    
    setTestingWeatherProviders(prev => [...prev, provider]);
    
    try {
      const internalStartTime = Date.now();
      
      // Use test coordinates (New York City)
      const testLat = 40.7128;
      const testLon = -74.0060;
      
      // Build URL with user context parameters (if available from LaunchDarkly)
      const baseUrl = `/api/weather/test?provider=${provider}&lat=${testLat}&lon=${testLon}`;
      const userParams = new URLSearchParams();
      
      // Try to get user context from LaunchDarkly (assuming it's available in window scope)
      const ldClient = (window as any).ldClient;
      if (ldClient && ldClient.getContext) {
        const userContext = ldClient.getContext();
        if (userContext) {
          if (userContext.key) userParams.append('userKey', userContext.key);
          if (userContext.name) userParams.append('userName', userContext.name);
          if (userContext.email) userParams.append('userEmail', userContext.email);
        }
      }
      
      const apiUrl = userParams.toString() ? `${baseUrl}&${userParams.toString()}` : baseUrl;
      const response = await fetch(apiUrl);
      const internalLatency = Date.now() - internalStartTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Track internal latency for successful test to LaunchDarkly
      if (ldClient && ldClient.track) {
        ldClient.track('internal_latency', {
          latency_ms: internalLatency,
          endpoint: '/api/weather/test',
          success: true,
          provider: provider,
          upstream_latency: data.upstreamLatency,
          test_coordinates: `${testLat},${testLon}`,
          timestamp: new Date().toISOString()
        });
      }
      
      const result: WeatherProviderTestResult = {
        provider,
        success: true,
        data,
        responseTime: internalLatency,
        timestamp: new Date()
      };
      
      setWeatherTestResults(prev => {
        const filtered = prev.filter(r => r.provider !== provider);
        return [...filtered, result];
      });
      
    } catch (error) {
      const internalLatency = Date.now() - Date.now(); // Approximate error latency
      
      // Track internal latency for failed test to LaunchDarkly
      const ldClient = (window as any).ldClient;
      if (ldClient && ldClient.track) {
        ldClient.track('internal_latency', {
          latency_ms: internalLatency,
          endpoint: '/api/weather/test',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: provider,
          test_coordinates: '40.7128,-74.0060',
          timestamp: new Date().toISOString()
        });
      }
      
      const result: WeatherProviderTestResult = {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      
      setWeatherTestResults(prev => {
        const filtered = prev.filter(r => r.provider !== provider);
        return [...filtered, result];
      });
    } finally {
      setTestingWeatherProviders(prev => prev.filter(p => p !== provider));
    }
  };

  const testAllWeatherProviders = async () => {
    if (testingAllProviders) return;
    
    setTestingAllProviders(true);
    setWeatherTestResults([]);
    
    try {
      const providers = weatherDebugInfo?.weatherProviders?.all || [];
      
      // Test all providers in parallel
      const testPromises = providers.map(provider => testWeatherProvider(provider));
      await Promise.all(testPromises);
      
    } catch (error) {
      console.error('Error testing all providers:', error);
    } finally {
      setTestingAllProviders(false);
    }
  };

  const clearTestResults = () => {
    setWeatherTestResults([]);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="debug-overlay" onClick={handleOverlayClick}>
      <div className="debug-panel" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="debug-header">
          <h2 className="debug-title">🧪 WEATHER API TESTING</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-info">
              {/* Main Action Buttons */}
              <div style={{ marginBottom: '20px' }}>
                <div className="info-row">
                  <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>QUICK ACTIONS:</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button 
                    className="error-test-button"
                    onClick={testAllWeatherProviders}
                    disabled={testingAllProviders || testingWeatherProviders.length > 0}
                    style={{
                      fontSize: '0.8rem',
                      padding: '10px 16px',
                      minWidth: '130px',
                      backgroundColor: 'transparent',
                      border: '2px solid #00ff00',
                      color: '#00ff00',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {testingAllProviders ? '🔄 TESTING...' : '🚀 TEST ALL'}
                  </button>
                  <button 
                    className="error-test-button"
                    onClick={clearTestResults}
                    disabled={testingAllProviders || testingWeatherProviders.length > 0}
                    style={{
                      fontSize: '0.8rem',
                      padding: '10px 16px',
                      minWidth: '100px',
                      backgroundColor: 'transparent',
                      border: '2px solid #ff6600',
                      color: '#ff6600',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ CLEAR
                  </button>
                </div>
              </div>
              
              {/* Individual provider test buttons */}
              {weatherDebugInfo?.weatherProviders?.all && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="info-row">
                    <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>INDIVIDUAL TESTS:</span>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px', 
                    marginTop: '12px' 
                  }}>
                    {weatherDebugInfo.weatherProviders.all.map(provider => {
                      const isAvailable = weatherDebugInfo.weatherProviders!.status[provider].available;
                      const isTesting = testingWeatherProviders.includes(provider);
                      
                      return (
                        <button
                          key={provider}
                          className="error-test-button"
                          onClick={() => testWeatherProvider(provider)}
                          disabled={isTesting || testingAllProviders}
                          style={{
                            fontSize: '0.8rem',
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: `2px solid ${isAvailable ? '#00ff00' : '#ff4444'}`,
                            color: isAvailable ? '#00ff00' : '#ff4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            minHeight: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            minWidth: '180px'
                          }}
                        >
                          {isTesting ? '🔄 TESTING...' : `${provider.toUpperCase()}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Test Results */}
              {weatherTestResults.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                  <div className="info-row">
                    <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>TEST RESULTS:</span>
                    <span className="info-value">
                      {weatherTestResults.filter(r => r.success).length} / {weatherTestResults.length} passed
                    </span>
                  </div>
                  
                  {weatherTestResults.map((result, index) => (
                    <div key={`${result.provider}-${index}`} style={{ marginTop: '10px' }}>
                      <div className="info-row">
                        <span className="info-label" style={{ fontSize: '0.85rem' }}>
                          {result.provider.toUpperCase()}:
                        </span>
                        <span className={`info-value ${result.success ? 'connected' : 'disconnected'}`} style={{ fontSize: '0.85rem' }}>
                          {result.success ? '✅' : '❌'} {result.success ? 'PASS' : 'FAIL'}
                          {result.responseTime && ` (${result.responseTime}ms)`}
                        </span>
                      </div>
                      
                      {result.error && (
                        <div className="info-row" style={{ marginLeft: '20px' }}>
                          <span className="info-label" style={{ fontSize: '0.8rem', color: '#ff4444' }}>ERROR:</span>
                          <span className="info-value" style={{ fontSize: '0.8rem', color: '#ff4444' }}>
                            {result.error}
                          </span>
                        </div>
                      )}
                      
                      {result.success && result.data && (
                        <div className="info-row" style={{ marginLeft: '20px' }}>
                          <span className="info-label" style={{ fontSize: '0.8rem', color: '#00ff00' }}>DATA:</span>
                          <span className="info-value" style={{ fontSize: '0.8rem', color: '#00ff00' }}>
                            {result.data.temperature}°C, {result.data.description}, {result.data.location}
                          </span>
                        </div>
                      )}
                      
                      <div className="info-row" style={{ marginLeft: '20px' }}>
                        <span className="info-label" style={{ fontSize: '0.75rem', color: '#888' }}>TIME:</span>
                        <span className="info-value" style={{ fontSize: '0.75rem', color: '#888' }}>
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.8rem', color: '#ffaa00' }}>
                  💡 Tests use New York City coordinates (40.7128, -74.0060)
                </p>
                <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                  🔍 Individual tests show which providers are working correctly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherApiTestingModal; 