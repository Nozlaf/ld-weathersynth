import React, { useState } from 'react';
import { getCachedWeatherData } from '../services/weatherService';

interface CacheViewerModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const CacheViewerModal: React.FC<CacheViewerModalProps> = ({ isVisible, onClose }) => {
  const [cachedWeatherData, setCachedWeatherData] = useState<any>(null);
  const [loadingCachedWeather, setLoadingCachedWeather] = useState(false);
  const [cachedWeatherError, setCachedWeatherError] = useState<string | null>(null);

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Auto-load cache data when modal opens
  React.useEffect(() => {
    if (isVisible && !cachedWeatherData && !loadingCachedWeather) {
      handleViewCachedWeather();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="debug-overlay" onClick={handleOverlayClick}>
      <div className="debug-panel" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="debug-header">
          <h2 className="debug-title">💾 WEATHER CACHE VIEWER</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-info">
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
                  {loadingCachedWeather ? '[ LOADING... ]' : '[ REFRESH CACHE ]'}
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
              
              {loadingCachedWeather && (
                <div className="info-row">
                  <span className="info-label">STATUS:</span>
                  <span className="info-value" style={{ color: '#ffaa00' }}>
                    🔄 Loading cache data...
                  </span>
                </div>
              )}
              
              {cachedWeatherData && (
                <div style={{ marginTop: '15px' }}>
                  <div className="info-row">
                    <span className="info-label">CACHE STATUS:</span>
                    <span className="info-value" style={{ color: '#00ff00' }}>
                      ✅ Data Retrieved ({new Date().toLocaleTimeString()})
                    </span>
                  </div>
                  
                  {/* Cache Summary */}
                  {cachedWeatherData.cacheInfo && (
                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                      <div className="info-row">
                        <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>CACHE SUMMARY:</span>
                      </div>
                      <div className="info-row" style={{ marginLeft: '20px' }}>
                        <span className="info-label">TOTAL ENTRIES:</span>
                        <span className="info-value">{cachedWeatherData.cacheInfo.totalEntries}</span>
                      </div>
                      <div className="info-row" style={{ marginLeft: '20px' }}>
                        <span className="info-label">VALID ENTRIES:</span>
                        <span className="info-value" style={{ color: '#00ff00' }}>{cachedWeatherData.cacheInfo.validEntries}</span>
                      </div>
                      <div className="info-row" style={{ marginLeft: '20px' }}>
                        <span className="info-label">EXPIRED ENTRIES:</span>
                        <span className="info-value" style={{ color: '#ff6600' }}>{cachedWeatherData.cacheInfo.expiredEntries}</span>
                      </div>
                      <div className="info-row" style={{ marginLeft: '20px' }}>
                        <span className="info-label">CACHE DURATION:</span>
                        <span className="info-value">{cachedWeatherData.cacheInfo.cacheDurationReadable}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Cached Entries */}
                  {cachedWeatherData.entries && cachedWeatherData.entries.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                      <div className="info-row">
                        <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>CACHED ENTRIES:</span>
                      </div>
                      {cachedWeatherData.entries.map((entry: any, index: number) => (
                        <div key={index} style={{ marginTop: '10px', padding: '10px', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '4px' }}>
                          <div className="info-row">
                            <span className="info-label">LOCATION:</span>
                            <span className="info-value">{entry.city} ({entry.coordinates})</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">WEATHER:</span>
                            <span className="info-value">{entry.temperature}°C, {entry.description}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">HUMIDITY:</span>
                            <span className="info-value">{entry.humidity}%</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">WIND:</span>
                            <span className="info-value">{entry.windSpeed} km/h</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">AGE:</span>
                            <span className={`info-value ${entry.cached.isValid ? 'connected' : 'disconnected'}`}>
                              {entry.cached.ageInMinutes}m ago {entry.cached.isValid ? '(Valid)' : '(Expired)'}
                            </span>
                          </div>
                          {entry.cached.isValid && (
                            <div className="info-row">
                              <span className="info-label">EXPIRES IN:</span>
                              <span className="info-value">{Math.round(entry.cached.expiresIn / 60)}m</span>
                            </div>
                          )}
                          <div className="info-row">
                            <span className="info-label">MOCK DATA:</span>
                            <span className={`info-value ${entry.isMockData ? 'disconnected' : 'connected'}`}>
                              {entry.isMockData ? '⚠️ Yes' : '✅ No'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Raw JSON Data */}
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                    <div className="info-row">
                      <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>RAW JSON DATA:</span>
                    </div>
                    <div style={{ 
                      background: 'rgba(0, 255, 255, 0.05)', 
                      border: '1px solid rgba(0, 255, 255, 0.2)', 
                      borderRadius: '8px', 
                      padding: '10px', 
                      marginTop: '10px',
                      maxHeight: '300px',
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
                </div>
              )}
              
              {!cachedWeatherData && !loadingCachedWeather && !cachedWeatherError && (
                <div className="info-row">
                  <span className="info-value">
                    Click "REFRESH CACHE" to load cached weather data
                  </span>
                </div>
              )}
              
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.8rem', color: '#ffaa00' }}>
                  💡 Cache stores weather data for 1 hour to reduce API calls
                </p>
                <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                  🔍 Valid entries are still fresh, expired entries need refresh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheViewerModal; 