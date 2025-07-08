import React from 'react';

interface ContextDataModalProps {
  isVisible: boolean;
  onClose: () => void;
  context: any;
}

const ContextDataModal: React.FC<ContextDataModalProps> = ({ isVisible, onClose, context }) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="debug-overlay" onClick={handleOverlayClick}>
      <div className="debug-panel" style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="debug-header">
          <h2 className="debug-title">👤 CONTEXT DATA</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
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
                        {JSON.stringify(context, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-context">No context available</span>
                </div>
              )}
              
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: '#ffaa00' }}>
                  💡 Context data is used by LaunchDarkly to target feature flags
                </p>
                <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                  🔍 Custom attributes help with advanced targeting and debugging
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextDataModal; 