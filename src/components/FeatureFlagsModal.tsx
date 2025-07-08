import React from 'react';

interface FeatureFlagsModalProps {
  isVisible: boolean;
  onClose: () => void;
  flags: { [key: string]: any };
}

const FeatureFlagsModal: React.FC<FeatureFlagsModalProps> = ({ isVisible, onClose, flags }) => {
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
          <h2 className="debug-title">🎛️ FEATURE FLAGS</h2>
          <button className="debug-close" onClick={onClose}>×</button>
        </div>
        
        <div className="debug-content">
          <div className="debug-section">
            <div className="debug-info">
              {Object.keys(flags).length > 0 ? (
                <>
                  <div className="info-row">
                    <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>TOTAL FLAGS:</span>
                    <span className="info-value">{Object.keys(flags).length}</span>
                  </div>
                  
                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                    {Object.entries(flags).map(([key, value]) => {
                      // Determine value type and format accordingly
                      let displayValue = value;
                      let valueClass = 'info-value flag-value';
                      
                      if (typeof value === 'boolean') {
                        displayValue = value ? '✅ true' : '❌ false';
                        valueClass += value ? ' connected' : ' disconnected';
                      } else if (typeof value === 'object' && value !== null) {
                        displayValue = JSON.stringify(value, null, 2);
                      } else if (value === null || value === undefined) {
                        displayValue = 'null';
                        valueClass += ' disconnected';
                      } else {
                        displayValue = String(value);
                      }
                      
                      return (
                        <div key={key} className="info-row" style={{ marginBottom: '10px' }}>
                          <span className="info-label">{key.toUpperCase()}:</span>
                          <span className={valueClass}>
                            {typeof value === 'object' && value !== null ? (
                              <pre style={{ 
                                margin: 0, 
                                fontSize: '0.8rem', 
                                background: 'rgba(0, 255, 255, 0.1)', 
                                padding: '8px', 
                                borderRadius: '4px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}>
                                {displayValue}
                              </pre>
                            ) : (
                              displayValue
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Flag Categories */}
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0, 255, 255, 0.3)' }}>
                    <div className="info-row">
                      <span className="info-label" style={{ color: '#ffff00', fontWeight: 'bold' }}>FLAG TYPES:</span>
                    </div>
                    
                    {/* Boolean Flags */}
                    {Object.entries(flags).filter(([_, value]) => typeof value === 'boolean').length > 0 && (
                      <div className="info-row">
                        <span className="info-label">BOOLEAN FLAGS:</span>
                        <span className="info-value">
                          {Object.entries(flags).filter(([_, value]) => typeof value === 'boolean').length}
                        </span>
                      </div>
                    )}
                    
                    {/* String Flags */}
                    {Object.entries(flags).filter(([_, value]) => typeof value === 'string').length > 0 && (
                      <div className="info-row">
                        <span className="info-label">STRING FLAGS:</span>
                        <span className="info-value">
                          {Object.entries(flags).filter(([_, value]) => typeof value === 'string').length}
                        </span>
                      </div>
                    )}
                    
                    {/* Number Flags */}
                    {Object.entries(flags).filter(([_, value]) => typeof value === 'number').length > 0 && (
                      <div className="info-row">
                        <span className="info-label">NUMBER FLAGS:</span>
                        <span className="info-value">
                          {Object.entries(flags).filter(([_, value]) => typeof value === 'number').length}
                        </span>
                      </div>
                    )}
                    
                    {/* JSON Flags */}
                    {Object.entries(flags).filter(([_, value]) => typeof value === 'object' && value !== null).length > 0 && (
                      <div className="info-row">
                        <span className="info-label">JSON FLAGS:</span>
                        <span className="info-value">
                          {Object.entries(flags).filter(([_, value]) => typeof value === 'object' && value !== null).length}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-value no-flags">No flags available (SDK not connected)</span>
                </div>
              )}
              
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: '#ffaa00' }}>
                  💡 Feature flags control app behavior and UI elements
                </p>
                <p style={{ fontSize: '0.8rem', color: '#00ffff' }}>
                  🔍 Create and manage flags in your LaunchDarkly dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsModal; 