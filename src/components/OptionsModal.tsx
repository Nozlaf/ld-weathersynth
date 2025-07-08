import React, { useState, useEffect, useRef } from 'react';
import { useTheme, Theme } from '../hooks/useTheme';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import AboutModal from './AboutModal';
import './OptionsModal.css';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperatureUnit: 'c' | 'f' | 'k';
  onTemperatureUnitChange: (unit: 'c' | 'f' | 'k') => void;
  distanceUnit: 'm' | 'i';
  onDistanceUnitChange: (unit: 'm' | 'i') => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose, temperatureUnit, onTemperatureUnitChange, distanceUnit, onDistanceUnitChange }) => {
  const { theme, setThemeManually, resetThemeToDefault, trackThemeChangeOnClose } = useTheme();
  const ldClient = useLDClient();
  const [initialTheme, setInitialTheme] = useState<Theme | null>(null);
  const [hasThemeChanged, setHasThemeChanged] = useState(false);
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const wasResetUsed = useRef(false);

  // Throw error during render if triggered
  if (shouldThrowError) {
    throw new Error('Test error from options modal - LaunchDarkly error tracking test');
  }

  // Track when modal opens and set initial theme
  useEffect(() => {
    if (isOpen && !initialTheme) {
      setInitialTheme(theme);
      setHasThemeChanged(false);
      wasResetUsed.current = false;
    }
  }, [isOpen, theme, initialTheme]);

  // Track theme changes during modal session
  useEffect(() => {
    if (isOpen && initialTheme && theme !== initialTheme) {
      setHasThemeChanged(true);
    }
  }, [theme, initialTheme, isOpen]);

  // Handle modal close with theme tracking
  const handleClose = () => {
    if (hasThemeChanged && initialTheme) {
      const changeMethod = wasResetUsed.current ? 'reset_to_default' : 'manual';
      trackThemeChangeOnClose(initialTheme, theme, changeMethod);
    }
    
    // Reset tracking state
    setInitialTheme(null);
    setHasThemeChanged(false);
    wasResetUsed.current = false;
    
    onClose();
  };

  if (!isOpen) return null;

  // Map LaunchDarkly themes to our theme system (same as ThemeProvider)
  const mapLDTheme = (ldTheme: string): Theme => {
    switch (ldTheme) {
      case 'dark':
        return 'dark-synth';
      case 'light':
        return 'light';
      case 'dark-synth':
        return 'dark-synth';
      case 'dark-green':
        return 'dark-green';
      case 'dark-orange':
        return 'dark-orange';
      case 'grayscale':
        return 'grayscale';
      case 'dark-grayscale':
        return 'dark-grayscale';
      case 'sakura':
        return 'sakura';
      case 'winter':
        return 'winter';
      case 'heart-of-gold':
        return 'heart-of-gold';
      default:
        return 'dark-synth';
    }
  };

  // Get the default theme from LaunchDarkly flag
  const getDefaultTheme = (): Theme => {
    if (ldClient) {
      const flagTheme = ldClient.variation('default-theme', 'dark');
      return mapLDTheme(flagTheme);
    }
    return 'dark-synth';
  };

  const defaultTheme = getDefaultTheme();

  const handleThemeSelect = (selectedTheme: Theme) => {
    setThemeManually(selectedTheme);
  };

  const handleResetToDefault = () => {
    wasResetUsed.current = true;
    resetThemeToDefault();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getThemeDisplayName = (themeKey: Theme): string => {
    const themeNames = {
      'dark-synth': 'Dark Synth Pop',
      'dark-green': 'Dark Green CRT',
      'dark-orange': 'Dark Orange Plasma',
      'light': 'Light',
      'grayscale': 'Grayscale',
      'dark-grayscale': 'Dark Grayscale',
      'sakura': 'Sakura Blossom',
      'winter': 'Winter Wonderland',
      'heart-of-gold': 'Heart of Gold'
    };
    return themeNames[themeKey] || themeKey;
  };

  const themes: Theme[] = ['dark-synth', 'dark-green', 'dark-orange', 'light', 'grayscale', 'dark-grayscale', 'sakura', 'winter', 'heart-of-gold'];

  return (
    <div className="options-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`options-modal ${theme}`}>
        <div className="options-terminal-frame">
          <div className="options-terminal-header">
            <span className="options-terminal-title">sys.cfg</span>
            <div className="options-terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
          </div>
          <div className="options-terminal-content">
            <div className="options-section">
              <div className="options-title">
                <pre>
{`
▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀   █▀ █▀▀ █░░ █▀▀ █▀▀ ▀█▀ █▀█ █▀█
░█░ █▀█ ██▄ █░▀░█ ██▄   ▄█ ██▄ █▄▄ ██▄ █▄▄ ░█░ █▄█ █▀▄
`}
                </pre>
              </div>
              
              <div className="theme-options">
                <div className="theme-option">
                  <span className="option-label">Theme Selection:</span>
                  <div className="theme-controls">
                    <select 
                      className="theme-dropdown"
                      value={theme}
                      onChange={(e) => handleThemeSelect(e.target.value as Theme)}
                    >
                      {themes.map((themeOption) => (
                        <option key={themeOption} value={themeOption}>
                          {getThemeDisplayName(themeOption)}
                          {themeOption === defaultTheme ? ' ⚡ DEFAULT' : ''}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="theme-reset-button"
                      onClick={handleResetToDefault}
                      title="Reset to LaunchDarkly default theme"
                    >
                      [ RESET ]
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="options-section">
              <div className="options-subtitle">
                <pre>
{`
▀█▀ █▀▀ █▀▄▀█ █▀█ █▀▀ █▀█ ▄▀█ ▀█▀ █░█ █▀█ █▀▀   █░█ █▄░█ █ ▀█▀ █▀
░█░ ██▄ █░▀░█ █▀▀ ██▄ █▀▄ █▀█ ░█░ █▄█ █▀▄ ██▄   █▄█ █░▀█ █ ░█░ ▄█
`}
                </pre>
              </div>
              
              <div className="temperature-options">
                <div className="temperature-option">
                  <span className="option-label">Current Unit:</span>
                  <span className="option-value">{temperatureUnit === 'c' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}</span>
                </div>
                
                <div className="temperature-buttons">
                  <button 
                    className={`temperature-button ${temperatureUnit === 'c' ? 'active' : ''}`}
                    onClick={() => onTemperatureUnitChange('c')}
                  >
                    [ CELSIUS (°C) ]
                  </button>
                  <button 
                    className={`temperature-button ${temperatureUnit === 'f' ? 'active' : ''}`}
                    onClick={() => onTemperatureUnitChange('f')}
                  >
                    [ FAHRENHEIT (°F) ]
                  </button>
                </div>
              </div>
            </div>

            <div className="options-section">
              <div className="options-subtitle">
                <pre>
{`
█▀▄ █ █▀ ▀█▀ ▄▀█ █▄░█ █▀▀ █▀▀   █░█ █▄░█ █ ▀█▀ █▀
█▄▀ █ ▄█ ░█░ █▀█ █░▀█ █▄▄ ██▄   █▄█ █░▀█ █ ░█░ ▄█
`}
                </pre>
              </div>
              
              <div className="distance-options">
                <div className="distance-option">
                  <span className="option-label">Current Unit:</span>
                  <span className="option-value">{distanceUnit === 'm' ? 'Kilometers (KM/H)' : 'Miles (MPH)'}</span>
                </div>
                
                <div className="distance-buttons">
                  <button 
                    className={`distance-button ${distanceUnit === 'm' ? 'active' : ''}`}
                    onClick={() => onDistanceUnitChange('m')}
                  >
                    [ KILOMETERS (KM/H) ]
                  </button>
                  <button 
                    className={`distance-button ${distanceUnit === 'i' ? 'active' : ''}`}
                    onClick={() => onDistanceUnitChange('i')}
                  >
                    [ MILES (MPH) ]
                  </button>
                </div>
              </div>
            </div>

            <div className="options-section">
              <div className="options-subtitle">
                <pre>
{`
▀█▀ █▀▀ █▀ ▀█▀   █▀▀ █▀█ █▀█ █▀█ █▀█
░█░ ██▄ ▄█ ░█░   ██▄ █▀▄ █▀▄ █▄█ █▀▄
`}
                </pre>
              </div>
              
              <div className="error-testing">
                <div className="error-option">
                  <span className="option-label">Error Boundary Testing:</span>
                  <span className="option-value">Test LaunchDarkly error tracking</span>
                </div>
                
                <div className="error-button-container">
                  <button 
                    className="error-test-button"
                    onClick={() => setShouldThrowError(true)}
                    title="Trigger a test error to validate error boundary and LaunchDarkly error tracking"
                  >
                    [ TRIGGER TEST ERROR ]
                  </button>
                  <p className="error-warning">
                    ⚠️ This will crash the app and show the error boundary screen
                  </p>
                </div>
              </div>
            </div>
            
            <div className="options-footer">
              <button className="about-button" onClick={() => setIsAboutOpen(true)}>
                [ ABOUT ]
              </button>
              <button className="close-button" onClick={handleClose}>
                [ CLOSE ]
              </button>
            </div>
          </div>
        </div>
        
        <div className="options-crt-effects">
          <div className="options-scan-lines"></div>
          <div className="options-screen-flicker"></div>
        </div>
      </div>
      
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
      />
    </div>
  );
};

export default OptionsModal; 