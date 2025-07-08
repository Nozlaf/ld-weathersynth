import React from 'react';
import { WeatherDebugInfo } from '../services/weatherDebugService';

interface WeatherDebugModalProps {
  isVisible: boolean;
  onClose: () => void;
  weatherDebugInfo: WeatherDebugInfo | null;
}

const WeatherDebugModal: React.FC<WeatherDebugModalProps> = ({ isVisible, onClose, weatherDebugInfo }) => {
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
          <h2 className="debug-title">🌤️ WEATHER API DEBUG</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-info">
              {weatherDebugInfo ? (
                <>
                  {/* API Status */}
                  <div className="info-row">
                    <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>API STATUS:</span>
                    <span className={`info-value ${weatherDebugInfo.apiKey.hasKey ? 'connected' : 'disconnected'}`}>
                      {weatherDebugInfo.apiKey.status}
                    </span>
                  </div>
                  
                  {/* Basic Info */}
                  <div className="info-row">
                    <span className="info-label">PROVIDER:</span>
                    <span className="info-value">{weatherDebugInfo.settings.provider}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">UPDATE INTERVAL:</span>
                    <span className="info-value">{weatherDebugInfo.settings.updateInterval} minutes</span>
                  </div>
                  
                  {/* Location Information */}
                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                    <div className="info-row">
                      <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>LOCATION:</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">METHOD:</span>
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
                  </div>
                  
                  {/* Request Information */}
                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                    <div className="info-row">
                      <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>LAST REQUEST:</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">STATUS:</span>
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
                      <span className="info-label">API URL:</span>
                      <span className="info-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {weatherDebugInfo.lastRequest.url || 'No requests made'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Weather Provider Information */}
                  {weatherDebugInfo.weatherProviders && (
                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                      <div className="info-row">
                        <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>PROVIDERS:</span>
                        <span className="info-value">
                          {weatherDebugInfo.weatherProviders.available.length} of {weatherDebugInfo.weatherProviders.all.length} available
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">CONFIG SOURCE:</span>
                        <span className="info-value">{weatherDebugInfo.weatherProviders.configSource}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">PRIMARY:</span>
                        <span className={`info-value ${weatherDebugInfo.weatherProviders.status[weatherDebugInfo.weatherProviders.currentConfig.primary]?.available ? 'connected' : 'disconnected'}`}>
                          {weatherDebugInfo.weatherProviders.currentConfig.primary} - {weatherDebugInfo.weatherProviders.status[weatherDebugInfo.weatherProviders.currentConfig.primary]?.status}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">FALLBACK:</span>
                        <span className={`info-value ${weatherDebugInfo.weatherProviders.status[weatherDebugInfo.weatherProviders.currentConfig.fallback]?.available ? 'connected' : 'disconnected'}`}>
                          {weatherDebugInfo.weatherProviders.currentConfig.fallback} - {weatherDebugInfo.weatherProviders.status[weatherDebugInfo.weatherProviders.currentConfig.fallback]?.status}
                        </span>
                      </div>
                      
                      {/* All Provider Status */}
                      <div style={{ marginTop: '10px' }}>
                        <div className="info-row">
                          <span className="info-label" style={{ fontSize: '0.85rem' }}>ALL PROVIDERS:</span>
                        </div>
                        {weatherDebugInfo.weatherProviders.all.map(provider => {
                          const status = weatherDebugInfo.weatherProviders!.status[provider];
                          return (
                            <div key={provider} className="info-row" style={{ marginLeft: '20px' }}>
                              <span className="info-label" style={{ fontSize: '0.8rem' }}>{provider.toUpperCase()}:</span>
                              <span className={`info-value ${status.available ? 'connected' : 'disconnected'}`} style={{ fontSize: '0.8rem' }}>
                                {status.available ? '✅' : '❌'} {status.status}
                                {status.requiresApiKey ? ' (API Key)' : ' (Free)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-context">Weather debug info not available</span>
                </div>
              )}
              
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: '#ffaa00' }}>
                  💡 Detailed weather API status and provider information
                </p>
                <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                  🔍 Use TEST WEATHER APIs for active provider testing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDebugModal; 