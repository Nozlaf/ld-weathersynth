import React, { useState, useEffect } from 'react';
import { WeatherData, getCurrentWeather } from '../services/weatherService';
import { useTheme } from '../hooks/useTheme';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import moonPhaseService from '../services/moonPhaseService';
import locationSimulationService from '../services/locationSimulationService';
import WeatherDebugService from '../services/weatherDebugService';
import OptionsModal from './OptionsModal';
import './WeatherWidget.css';

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [moonPhaseEmoji, setMoonPhaseEmoji] = useState<string>('🌙');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  const { theme } = useTheme();
  const ldClient = useLDClient();
  const weatherDebug = WeatherDebugService.getInstance();

  const fetchMoonPhase = async () => {
    try {
      const moonEmoji = await moonPhaseService.getMoonPhaseEmojiForWeather();
      setMoonPhaseEmoji(moonEmoji);
    } catch (error) {
      console.warn('Failed to fetch moon phase:', error);
      // Keep the default moon emoji if fetching fails
    }
  };

  const fetchWeather = async () => {
    try {
      console.log('🔍 DEBUG: fetchWeather called');
      setLoading(true);
      setError(null);
      const weatherData = await getCurrentWeather();
      console.log('🔍 DEBUG: Weather data received:', weatherData);
      setWeather(weatherData);
      setLastUpdated(new Date());
      
      // Fetch moon phase data for accurate nighttime display
      await fetchMoonPhase();
    } catch (err) {
      console.error('🔍 DEBUG: fetchWeather error:', err);
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
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

  // Get LaunchDarkly flags
  const enableAnimations = ldClient ? ldClient.variation('enable-animations', true) : true;
  const showExtraWeatherInfo = ldClient ? ldClient.variation('show-extra-weather-info', true) : true;

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
      unsubscribeLocationSimulation();
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
    };
    
    ldClient.on('change', handleFlagChange);
    
    return () => {
      ldClient.off('change', handleFlagChange);
    };
  }, [ldClient]);

  const getWeatherIcon = (iconCode: string) => {
    // Retro-style weather icons using Unicode
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': moonPhaseEmoji, // Use accurate moon phase for clear nights
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

  if (loading) {
    return (
      <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`}>
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
      <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`}>
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
    <div className={`weather-widget ${theme} ${enableAnimations ? 'animated' : ''}`}>
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
              <div className="weather-temp">{weather.temperature}°C</div>
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
                  <span className="detail-value">{weather.windSpeed} KM/H</span>
                </div>
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
      />
    </div>
  );
};

export default WeatherWidget; 