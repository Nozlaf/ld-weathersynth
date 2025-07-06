import React from 'react';
import { useTheme, Theme } from '../hooks/useTheme';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import './OptionsModal.css';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperatureUnit: 'c' | 'f';
  onTemperatureUnitChange: (unit: 'c' | 'f') => void;
  distanceUnit: 'km' | 'mi';
  onDistanceUnitChange: (unit: 'km' | 'mi') => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose, temperatureUnit, onTemperatureUnitChange, distanceUnit, onDistanceUnitChange }) => {
  const { theme, setThemeManually, resetThemeToDefault } = useTheme();
  const ldClient = useLDClient();

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
    resetThemeToDefault();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getThemeDisplayName = (themeKey: Theme): string => {
    const themeNames = {
      'dark-synth': 'Dark Synth Pop',
      'dark-green': 'Dark Green CRT',
      'dark-orange': 'Dark Orange Plasma',
      'light': 'Light',
      'grayscale': 'Grayscale'
    };
    return themeNames[themeKey] || themeKey;
  };

  const themes: Theme[] = ['dark-synth', 'dark-green', 'dark-orange', 'light', 'grayscale'];

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
                  <span className="option-label">Current Theme:</span>
                  <span className="option-value">{getThemeDisplayName(theme)}</span>
                </div>
                
                <div className="theme-buttons">
                  {themes.map((themeOption) => (
                    <button 
                      key={themeOption}
                      className={`theme-button ${theme === themeOption ? 'active' : ''}`}
                      onClick={() => handleThemeSelect(themeOption)}
                    >
                      [ {getThemeDisplayName(themeOption).toUpperCase()} ]
                      {themeOption === defaultTheme && (
                        <span className="default-indicator"> ⚡ DEFAULT</span>
                      )}
                    </button>
                  ))}
                  <button 
                    className="theme-button reset"
                    onClick={handleResetToDefault}
                  >
                    [ RESET TO DEFAULT ]
                  </button>
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
                  <span className="option-value">{distanceUnit === 'km' ? 'Kilometers (KM/H)' : 'Miles (MPH)'}</span>
                </div>
                
                <div className="distance-buttons">
                  <button 
                    className={`distance-button ${distanceUnit === 'km' ? 'active' : ''}`}
                    onClick={() => onDistanceUnitChange('km')}
                  >
                    [ KILOMETERS (KM/H) ]
                  </button>
                  <button 
                    className={`distance-button ${distanceUnit === 'mi' ? 'active' : ''}`}
                    onClick={() => onDistanceUnitChange('mi')}
                  >
                    [ MILES (MPH) ]
                  </button>
                </div>
              </div>
            </div>
            
            <div className="options-footer">
              <button className="close-button" onClick={onClose}>
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
    </div>
  );
};

export default OptionsModal; 