import React from 'react';
import { useTheme } from '../hooks/useTheme';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Custom SVG Icons
  const GitHubIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className="social-icon github-icon"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );

  const LiveDemoIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className="social-icon demo-icon"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );

  const StarIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className="social-icon star-icon"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );

  const ForkIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className="social-icon fork-icon"
    >
      <path d="M8 2a2 2 0 00-2 2v1a2 2 0 002 2h1v2.5A2.5 2.5 0 006.5 12a2.5 2.5 0 00-2.5 2.5v3A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5v-3A2.5 2.5 0 0017.5 12a2.5 2.5 0 00-2.5-2.5V7h1a2 2 0 002-2V4a2 2 0 00-2-2h-8z"/>
    </svg>
  );

  return (
    <div className="about-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`about-modal ${theme}`}>
        <div className="about-terminal-frame">
          <div className="about-terminal-header">
            <span className="about-terminal-title">about.exe</span>
            <div className="about-terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
          </div>
          
          <div className="about-terminal-content">
            <div className="about-section">
              <div className="about-title">
                <pre>
{`
█░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█   █▀ █▄█ █▄░█ ▀█▀ █░█
▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄   ▄█ ░█░ █░▀█ ░█░ █▀█
`}
                </pre>
              </div>
              
              <div className="about-info">
                <div className="app-description">
                  <p>🌊 <strong>Weather Synth</strong> - A retro 80s weather app</p>
                  <p>Built with React, TypeScript & LaunchDarkly</p>
                  <p className="version">Version 1.2.0</p>
                </div>
                
                <div className="developer-info">
                  <p>🧪 Created during a "vibe coding" experiment</p>
                  <p>🎯 Testing LaunchDarkly Cursor Rules & AI development</p>
                  <p>🎨 Inspired by 80s synthpop & terminal aesthetics</p>
                </div>
              </div>
            </div>

            <div className="about-section">
              <div className="social-title">
                <pre>
{`
█▀ █▀█ █▀▀ █ ▄▀█ █░   █▀▄▀█ █▀▀ █▀▄ █ ▄▀█
▄█ █▄█ █▄▄ █ █▀█ █▄   █░▀░█ ██▄ █▄▀ █ █▀█
`}
                </pre>
              </div>
              
              <div className="social-links">
                <a 
                  href="https://github.com/Nozlaf/ld-weathersynth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link github-link"
                  title="View source code on GitHub"
                >
                  <GitHubIcon />
                  <span className="social-text">VIEW SOURCE</span>
                  <span className="social-description">Repository & Documentation</span>
                </a>
                
                <a 
                  href="https://weather.imadethis.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link demo-link"
                  title="Visit live demo site"
                >
                  <LiveDemoIcon />
                  <span className="social-text">LIVE DEMO</span>
                  <span className="social-description">Try the production version</span>
                </a>
                
                <a 
                  href="https://github.com/Nozlaf/ld-weathersynth/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link star-link"
                  title="Star this project on GitHub"
                >
                  <StarIcon />
                  <span className="social-text">STAR PROJECT</span>
                  <span className="social-description">Show your support</span>
                </a>
                
                <a 
                  href="https://github.com/Nozlaf/ld-weathersynth/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link fork-link"
                  title="Fork this project on GitHub"
                >
                  <ForkIcon />
                  <span className="social-text">FORK PROJECT</span>
                  <span className="social-description">Create your own version</span>
                </a>
              </div>
            </div>

            <div className="about-section">
              <div className="tech-title">
                <pre>
{`
▀█▀ █▀▀ █▀▀ █░█   █▀ ▀█▀ ▄▀█ █▀▀ █▄▀
░█░ ██▄ █▄▄ █▀█   ▄█ ░█░ █▀█ █▄▄ █░█
`}
                </pre>
              </div>
              
              <div className="tech-stack">
                <div className="tech-item">
                  <span className="tech-label">Frontend:</span>
                  <span className="tech-value">React 19 + TypeScript</span>
                </div>
                <div className="tech-item">
                  <span className="tech-label">Feature Flags:</span>
                  <span className="tech-value">LaunchDarkly SDK</span>
                </div>
                <div className="tech-item">
                  <span className="tech-label">Weather Data:</span>
                  <span className="tech-value">OpenWeatherMap API</span>
                </div>
                <div className="tech-item">
                  <span className="tech-label">Infrastructure:</span>
                  <span className="tech-value">Terraform + PM2</span>
                </div>
                <div className="tech-item">
                  <span className="tech-label">Development:</span>
                  <span className="tech-value">Cursor + Claude-4-Sonnet</span>
                </div>
              </div>
            </div>
            
            <div className="about-footer">
              <div className="copyright">
                <p>Made with 💜 and ⚡ - Embrace the retro future!</p>
                <p className="license">MIT License © 2025</p>
              </div>
              <button className="close-button" onClick={onClose}>
                [ CLOSE ]
              </button>
            </div>
          </div>
        </div>
        
        <div className="about-crt-effects">
          <div className="about-scan-lines"></div>
          <div className="about-screen-flicker"></div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal; 