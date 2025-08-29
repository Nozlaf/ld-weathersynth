import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import './ConsentWarning.css';

interface ConsentWarningProps {
  onAccept: () => void;
  onReject: () => void;
}

const ConsentWarning: React.FC<ConsentWarningProps> = ({ onAccept, onReject }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('ld_consent');
    if (hasConsented === 'true') {
      setIsVisible(false);
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    setIsClosing(true);
    localStorage.setItem('ld_consent', 'true');
    setTimeout(() => {
      setIsVisible(false);
      onAccept();
    }, 500); // Match animation duration
  };

  const handleReject = () => {
    setIsClosing(true);
    localStorage.setItem('ld_consent', 'false');
    setTimeout(() => {
      setIsVisible(false);
      onReject();
    }, 500); // Match animation duration
  };

  if (!isVisible) return null;

  return (
    <div className={`consent-warning ${theme} ${isClosing ? 'closing' : ''}`}>
      <div className="consent-terminal">
        <div className="consent-header">
          <span className="consent-title">SYSTEM NOTICE</span>
          <div className="consent-controls">
            <span className="control-dot red"></span>
            <span className="control-dot yellow"></span>
            <span className="control-dot green"></span>
          </div>
        </div>
        <div className="consent-content">
          <pre className="consent-ascii">
{`
█░█░█ ▄▀█ █▀█ █▄░█ █ █▄░█ █▀▀
▀▄▀▄▀ █▀█ █▀▄ █░▀█ █ █░▀█ █▄█
`}
          </pre>
          <div className="consent-message">
            <p>IMPORTANT: This site is a technology demonstration of LaunchDarkly's feature management and observability platform.</p>
            
            <p>By continuing to use this site, you acknowledge and consent to:</p>
            
            <ul>
              <li>Session Recording: Your interactions with this site will be recorded</li>
              <li>Observability Data: Usage patterns and behaviors will be analyzed</li>
              <li>Data Collection: Interaction data will be available to LaunchDarkly users</li>
            </ul>

            <p>This is a demo environment where you waive privacy rights related to site interaction data.</p>
            
            <div className="consent-buttons">
              <button className="accept-button" onClick={handleAccept}>
                [ ACCEPT & CONTINUE ]
              </button>
              <button className="reject-button" onClick={handleReject}>
                [ REJECT & EXIT ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentWarning; 