import React, { useState, useEffect } from 'react';
import { WeatherData, getCurrentWeather, WeatherAPIError } from '../services/weatherService';
import { useTheme } from '../hooks/useTheme';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import moonPhaseService from '../services/moonPhaseService';
import { MoonPhaseResponse } from '../types/moonPhase';
import locationSimulationService from '../services/locationSimulationService';
import WeatherDebugService from '../services/weatherDebugService';
import OptionsModal from './OptionsModal';
import APIErrorModal from './APIErrorModal';
import './WeatherWidget.css';

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<WeatherAPIError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [moonPhaseData, setMoonPhaseData] = useState<MoonPhaseResponse | null>(null);
  const [showMoonTooltip, setShowMoonTooltip] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'c' | 'f' | 'k'>('c');
  const [distanceUnit, setDistanceUnit] = useState<'m' | 'i'>('m');
  
  const { theme } = useTheme();
  const ldClient = useLDClient();
  const weatherDebug = WeatherDebugService.getInstance();

  const fetchMoonPhase = async () => {
    try {
      const moonData = await moonPhaseService.getCurrentMoonPhase();
      setMoonPhaseData(moonData);
    } catch (error) {
      console.warn('Failed to fetch moon phase:', error);
      // Keep the default moon data if fetching fails
      setMoonPhaseData({
        data: {
          Error: 1,
          ErrorMsg: 'Failed to fetch',
          TargetDate: Date.now().toString(),
          Moon: ['Unknown'],
          Index: 0,
          Age: 0,
          Phase: 'Unknown',
          Distance: 0,
          Illumination: 0.5,
          AngularDiameter: 0,
          DistanceToSun: 0,
          SunAngularDiameter: 0
        },
        phase: 'Unknown',
        illumination: 0.5,
        emoji: '🌙'
      });
    }
  };

  const fetchWeather = async () => {
    try {
      console.log('🔍 DEBUG: fetchWeather called');
      setLoading(true);
      setError(null);
      setApiError(null);
      const weatherData = await getCurrentWeather(ldClient);
      console.log('🔍 DEBUG: Weather data received:', weatherData);
      setWeather(weatherData);
      setLastUpdated(new Date());
      
      // Fetch moon phase data for accurate nighttime display
      await fetchMoonPhase();
    } catch (err) {
      console.error('🔍 DEBUG: fetchWeather error:', err);
      
      // Handle WeatherAPIError objects
      if (err && typeof err === 'object' && 'type' in err) {
        const weatherError = err as WeatherAPIError;
        console.log('🔍 DEBUG: WeatherAPIError detected:', weatherError);
        
        // For API key errors, show the modal
        if (weatherError.type === 'API_KEY_INVALID') {
          setApiError(weatherError);
        } else {
          setError(`API Error ${weatherError.code}: ${weatherError.message}`);
        }
        
        // Provide fallback demo data
        const fallbackData = {
          temperature: 22,
          description: 'Demo Weather',
          location: 'Demo City, XX',
          humidity: 65,
          windSpeed: 12,
          icon: '01d',
        };
        setWeather(fallbackData);
        setLastUpdated(new Date());
      } else {
        // Handle generic errors
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsClick = () => {
    setIsOptionsOpen(true);
  };

  const handleCloseOptions = () => {
    setIsOptionsOpen(false);
  };

  const handleCloseApiError = () => {
    setApiError(null);
  };

  // Get LaunchDarkly flags - Following Rule 1: Centralized evaluation with predictable fallback
  const enableAnimations = ldClient ? ldClient.variation('enable-animations', true) : true;
  const showExtraWeatherInfo = ldClient ? ldClient.variation('show-extra-weather-info', true) : true;
  const showMoonPhase = ldClient ? ldClient.variation('show-moon-phase', true) : true;

  useEffect(() => {
    console.log('🔍 DEBUG: WeatherWidget useEffect setting up');
    
    // Add global error handler to catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('🔍 DEBUG: Unhandled error detected:', event.error);
      console.error('🔍 DEBUG: Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };
    
    window.addEventListener('error', handleError);
    
    fetchWeather();
    
    // Get refresh interval from LaunchDarkly flag (in minutes, default 5 minutes)
    const refreshIntervalMinutes = ldClient ? ldClient.variation('weather-refresh-interval', 5) : 5;
    const refreshIntervalMs = refreshIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    // Update debug service with current interval
    weatherDebug.updateRefreshInterval(refreshIntervalMinutes);
    
    console.log(`🔍 DEBUG: Setting weather refresh interval to ${refreshIntervalMinutes} minutes (${refreshIntervalMs}ms)`);
    
    // Set up auto-refresh with configurable interval
    const interval = setInterval(fetchWeather, refreshIntervalMs);
    
    // Subscribe to location simulation changes
    const unsubscribeLocationSimulation = locationSimulationService.subscribe((state) => {
      try {
        console.log('🔍 DEBUG: WeatherWidget received location simulation state change:', state);
        // Refresh weather data when location simulation changes
        fetchWeather();
      } catch (error) {
        console.error('🔍 DEBUG: Error in WeatherWidget location simulation subscription:', error);
      }
    });
    
    console.log('🔍 DEBUG: WeatherWidget subscription set up');
    
    return () => {
      console.log('🔍 DEBUG: WeatherWidget cleanup');
      window.removeEventListener('error', handleError);
      clearInterval(interval);
      // Defensive check to ensure unsubscribe function exists
      if (typeof unsubscribeLocationSimulation === 'function') {
        unsubscribeLocationSimulation();
      } else {
        console.warn('🔍 DEBUG: unsubscribeLocationSimulation is not a function:', typeof unsubscribeLocationSimulation);
      }
    };
  }, [ldClient]);

  // Listen for LaunchDarkly flag changes to trigger re-renders
  useEffect(() => {
    if (!ldClient) return;
    
    const handleFlagChange = (changes: any) => {
      if (changes['enable-animations']) {
        console.log('🔍 DEBUG: enable-animations flag changed:', changes['enable-animations']);
        // Force re-render by updating a dummy state or just let the component re-render naturally
        // The component will automatically pick up the new flag value on next render
      }
      if (changes['show-extra-weather-info']) {
        console.log('🔍 DEBUG: show-extra-weather-info flag changed:', changes['show-extra-weather-info']);
        // Component will automatically re-render and pick up the new flag value
      }
      if (changes['default-temperature']) {
        console.log('🔍 DEBUG: default-temperature flag changed:', changes['default-temperature']);
        const newTempUnit = changes['default-temperature'].current;
        // Support 'c', 'f', and 'k' values from LaunchDarkly
        if (newTempUnit === 'c' || newTempUnit === 'f' || newTempUnit === 'k') {
          setTemperatureUnit(newTempUnit);
        } else {
          setTemperatureUnit('c'); // Fallback to Celsius
        }
      }
      if (changes['default-distance']) {
        console.log('🔍 DEBUG: default-distance flag changed:', changes['default-distance']);
        setDistanceUnit(changes['default-distance'].current);
      }
      if (changes['show-moon-phase']) {
        console.log('🔍 DEBUG: show-moon-phase flag changed:', changes['show-moon-phase']);
        // Component will automatically re-render and pick up the new flag value
      }
    };
    
    ldClient.on('change', handleFlagChange);
    
    return () => {
      ldClient.off('change', handleFlagChange);
    };
  }, [ldClient]);

  // Initialize temperature unit from LaunchDarkly flag
  useEffect(() => {
    if (ldClient) {
      const flagValue = ldClient.variation('default-temperature', 'c');
      // Support 'c', 'f', and 'k' values from LaunchDarkly
      if (flagValue === 'c' || flagValue === 'f' || flagValue === 'k') {
        setTemperatureUnit(flagValue);
      } else {
        setTemperatureUnit('c'); // Fallback to Celsius
      }
    }
  }, [ldClient]);

  // Initialize distance unit from LaunchDarkly flag
  useEffect(() => {
    if (ldClient) {
      const flagValue = ldClient.variation('default-distance', 'm');
      setDistanceUnit(flagValue);
    }
  }, [ldClient]);

  const getWeatherIcon = (iconCode: string) => {
    // Retro-style weather icons using Unicode
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌌', // Clear night sky for clear nights (moon phase shown separately)
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌡️';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const convertCelsiusToFahrenheit = (celsius: number): number => {
    return Math.round((celsius * 9/5) + 32);
  };

  const convertCelsiusToKelvin = (celsius: number): number => {
    return Math.round((celsius + 273.15) * 100) / 100; // Keep two decimal places for precision
  };

  const formatTemperature = (temperature: number): string => {
    if (temperatureUnit === 'f') {
      return `${convertCelsiusToFahrenheit(temperature)}°F`;
    } else if (temperatureUnit === 'k') {
      return `${convertCelsiusToKelvin(temperature)} K`;
    }
    return `${temperature}°C`;
  };

  const convertKmhToMph = (kmh: number): number => {
    return Math.round(kmh * 0.621371);
  };

  const formatWindSpeed = (windSpeed: number): string => {
    if (distanceUnit === 'i') {
      return `${convertKmhToMph(windSpeed)} MPH`;
    }
    return `${windSpeed} KM/H`;
  };

  if (loading) {
    return (
      <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`} role="main">
        <div className="terminal-frame">
          <div className="terminal-header">
            <span className="terminal-title">WEATHER.SYS</span>
            <div className="terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
          </div>
          <div className="terminal-content">
            <div className="loading-animation">
              {enableAnimations && <div className="scan-line"></div>}
              <pre className="ascii-art">
{`
█░█░█ █▀▀ ▄▀█ ▀█▀ █░█ █▀▀ █▀█
▀▄▀▄▀ ██▄ █▀█ ░█░ █▀█ ██▄ █▀▄

     L O A D I N G . . .
`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`} role="main">
        <div className="terminal-frame">
          <div className="terminal-header">
            <span className="terminal-title">WEATHER.SYS</span>
            <div className="terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
          </div>
          <div className="terminal-content">
            <div className="error-message">
              <pre>
{`
█▀▀ █▀█ █▀█ █▀█ █▀█
██▄ █▀▄ █▀▄ █▄█ █▀▄

SYSTEM ERROR: ${error}
`}
              </pre>
              <div className="button-group">
                <button className="refresh-button" onClick={fetchWeather}>
                  [ RETRY ]
                </button>
                <button className="refresh-button" onClick={handleOptionsClick}>
                  [ OPTIONS ]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`} role="main">
      <div className="terminal-frame">
        <div className="terminal-header">
          <span className="terminal-title">WEATHER.SYS</span>
          <div className="terminal-controls">
            <span className="control-dot red"></span>
            <span className="control-dot yellow"></span>
            <span className="control-dot green"></span>
          </div>
        </div>
        <div className="terminal-content">
          <div className="weather-display">
            <div className="weather-header">
              <div className="weather-icon">{getWeatherIcon(weather.icon)}</div>
              <div className="weather-temp">{formatTemperature(weather.temperature)}</div>
            </div>
            
            <div className="weather-info">
              <div className="location">{weather.location}</div>
              <div className="description">{weather.description.toUpperCase()}</div>
            </div>

            {showExtraWeatherInfo && (
              <div className="weather-details">
                <div className="detail-row">
                  <span className="detail-label">HUMIDITY:</span>
                  <span className="detail-value">{weather.humidity}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">WIND:</span>
                  <span className="detail-value">{formatWindSpeed(weather.windSpeed)}</span>
                </div>
                {showMoonPhase && moonPhaseData && (
                  <div className="detail-row">
                    <span className="detail-label">MOON PHASE:</span>
                    <span className="detail-value moon-phase-detail">
                      <span 
                        className="moon-phase-icon"
                        title={moonPhaseData.phase}
                        onMouseEnter={() => setShowMoonTooltip(true)}
                        onMouseLeave={() => setShowMoonTooltip(false)}
                        onClick={() => setShowMoonTooltip(!showMoonTooltip)}
                        style={{ cursor: 'help', position: 'relative' }}
                      >
                        {moonPhaseData.emoji}
                        {showMoonTooltip && (
                          <div className="moon-tooltip">
                            <div className="moon-tooltip-content">
                              <strong>{moonPhaseData.phase}</strong>
                              <div className="moon-tooltip-details">
                                <small>Illumination: {Math.round(moonPhaseData.illumination * 100)}%</small>
                              </div>
                            </div>
                          </div>
                        )}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="terminal-footer">
              <div className="timestamp">
                LAST UPDATE: {lastUpdated && formatTime(lastUpdated)}
              </div>
              <div className="button-group">
                <button className="refresh-button" onClick={fetchWeather}>
                  [ REFRESH ]
                </button>
                <button className="refresh-button" onClick={handleOptionsClick}>
                  [ OPTIONS ]
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {enableAnimations && (
          <div className="crt-effects">
            <div className="scan-lines"></div>
            <div className="screen-flicker"></div>
          </div>
        )}
      </div>
      
      <OptionsModal 
        isOpen={isOptionsOpen} 
        onClose={handleCloseOptions} 
        temperatureUnit={temperatureUnit}
        onTemperatureUnitChange={setTemperatureUnit}
        distanceUnit={distanceUnit}
        onDistanceUnitChange={setDistanceUnit}
      />
      
      <APIErrorModal
        isOpen={apiError !== null}
        onClose={handleCloseApiError}
        errorCode={apiError?.code}
        errorMessage={apiError?.message}
      />
    </div>
  );
};

export default WeatherWidget; 