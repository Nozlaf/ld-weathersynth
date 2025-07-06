import React from 'react';
import { useTheme } from '../hooks/useTheme';
import './APIErrorModal.css';

interface APIErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode?: number;
  errorMessage?: string;
}

const APIErrorModal: React.FC<APIErrorModalProps> = ({ 
  isOpen, 
  onClose, 
  errorCode = 401, 
  errorMessage = "Invalid API key" 
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRetry = () => {
    // Close modal and let parent component retry
    onClose();
    // Force a page reload to retry with potentially new API key
    window.location.reload();
  };

  return (
    <div className="api-error-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`api-error-modal ${theme}`}>
        <div className="api-error-terminal-frame">
          <div className="api-error-terminal-header">
            <span className="api-error-terminal-title">sys.error</span>
            <div className="api-error-terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
          </div>
          <div className="api-error-terminal-content">
            <div className="api-error-section">
              <div className="api-error-title">
                <pre>
{`
▄▀█ █▀█ █   █▀▀ █▀█ █▀█ █▀█ █▀█
█▀█ █▀▀ █   ██▄ █▀▄ █▀▄ █▄█ █▀▄
`}
                </pre>
              </div>
              
              <div className="api-error-details">
                <div className="error-info">
                  <div className="error-code">ERROR {errorCode}</div>
                  <div className="error-message">{errorMessage}</div>
                </div>
                
                <div className="error-description">
                  <p>The OpenWeather API key is invalid or missing. To get real weather data, you need to set up a free API key.</p>
                </div>
                
                <div className="setup-instructions">
                  <div className="instruction-title">🔧 SETUP INSTRUCTIONS:</div>
                  <ol className="instruction-list">
                    <li>Visit <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="api-link">openweathermap.org/api</a></li>
                    <li>Sign up for a free account</li>
                    <li>Get your API key from the dashboard</li>
                    <li>Add it to your <code>.env</code> file:</li>
                  </ol>
                  <div className="code-block">
                    <pre>
                      REACT_APP_OPENWEATHER_API_KEY=your_api_key_here
                    </pre>
                  </div>
                  <div className="note">
                    💡 <strong>Note:</strong> New API keys may take up to 10 minutes to activate.
                  </div>
                </div>
                
                <div className="fallback-info">
                  <div className="fallback-title">🎭 DEMO MODE:</div>
                  <p>Without a valid API key, the app will show demo weather data. All other features (themes, settings, etc.) will work normally.</p>
                </div>
              </div>
            </div>
            
            <div className="api-error-footer">
              <button className="retry-button" onClick={handleRetry}>
                [ RETRY ]
              </button>
              <button className="close-button" onClick={onClose}>
                [ CONTINUE WITH DEMO ]
              </button>
            </div>
          </div>
        </div>
        
        <div className="api-error-crt-effects">
          <div className="api-error-scan-lines"></div>
          <div className="api-error-screen-flicker"></div>
        </div>
      </div>
    </div>
  );
};

export default APIErrorModal; 