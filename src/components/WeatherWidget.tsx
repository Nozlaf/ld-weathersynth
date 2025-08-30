import React, { useState, useEffect } from 'react';
import { getCurrentWeather, WeatherAPIError, getCurrentLocation, Location, WeatherData, AirQualityData, UVIndexData } from '../services/weatherService';
import { useTheme } from '../hooks/useTheme';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import locationSimulationService from '../services/locationSimulationService';
import WeatherDebugService from '../services/weatherDebugService';
import MoonPhaseService from '../services/moonPhaseService';
import OptionsModal from './OptionsModal';
import APIErrorModal from './APIErrorModal';
import AirQualityModal from './AirQualityModal';
import UVIndexModal from './UVIndexModal';
import './WeatherWidget.css';

interface ForecastHour {
  time: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  hasRain?: boolean;
  pop?: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<WeatherAPIError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'c' | 'f' | 'k'>('c');
  const [distanceUnit, setDistanceUnit] = useState<'m' | 'i'>('m');
  const [showWeatherTooltip, setShowWeatherTooltip] = useState<boolean>(false);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [forecast, setForecast] = useState<ForecastHour[]>([]);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [hoveredForecastIndex, setHoveredForecastIndex] = useState<number | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [isAirQualityOpen, setIsAirQualityOpen] = useState(false);
  const [isUVIndexOpen, setIsUVIndexOpen] = useState(false);
  
  const { theme } = useTheme();
  const ldClient = useLDClient();
  const { getShowMoonPhase } = useFeatureFlags();
  const weatherDebug = WeatherDebugService.getInstance();
  const moonPhaseService = MoonPhaseService.getInstance();

  const fetchWeather = async () => {
    try {
      console.log('🔍 DEBUG: fetchWeather called');
      setLoading(true);
      setError(null);
      setApiError(null);
      
      // Get current location first
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      const weatherData = await getCurrentWeather(ldClient);
      console.log('🔍 DEBUG: Weather data received:', weatherData);
      setWeather(weatherData);
      setLastUpdated(new Date());
      
      // Calculate moon phase
      const currentMoonPhase = moonPhaseService.getCurrentMoonPhase();
      setMoonPhase(currentMoonPhase);
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
          provider: 'demo',
          mockData: true,
          hasRain: false,
          hasAlerts: false,
          alerts: []
        };
        setWeather(fallbackData);
        setLastUpdated(new Date());
        
        // Calculate moon phase for demo data
        const demoMoonPhase = moonPhaseService.getCurrentMoonPhase();
        setMoonPhase(demoMoonPhase);
      } else {
        // Handle generic errors
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch forecast data
  const fetchForecast = async () => {
    if (!currentLocation || !weather) return;
    
    setForecastLoading(true);
    try {
      const response = await fetch(`/api/weather/forecast?lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
      if (response.ok) {
        const data = await response.json();
        
        // Convert object with numeric keys to array
        const forecastArray = Object.keys(data)
          .filter(key => key !== 'upstreamLatency' && !isNaN(Number(key)))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => data[key]);
        
        console.log('🔍 DEBUG: Forecast data received:', data);
        console.log('🔍 DEBUG: Converted forecast array:', forecastArray);
        
        setForecast(forecastArray);
      } else {
        console.error('Failed to fetch forecast:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setForecastLoading(false);
    }
  };

  // Handle weather icon click
  const handleWeatherIconClick = () => {
    console.log('🔍 DEBUG: Weather icon clicked!');
    console.log('🔍 DEBUG: Current showForecast state:', showForecast);
    console.log('🔍 DEBUG: Current weather data:', weather);
    
    if (!showForecast) {
      console.log('🔍 DEBUG: Fetching forecast...');
      fetchForecast();
    }
    setShowForecast(!showForecast);
    setShowWeatherTooltip(false); // Hide tooltip when showing forecast
    console.log('🔍 DEBUG: New showForecast state will be:', !showForecast);
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

  const handleOpenAirQuality = () => {
    setIsAirQualityOpen(true);
  };

  const handleCloseAirQuality = () => {
    setIsAirQualityOpen(false);
  };

  const handleOpenUVIndex = () => {
    setIsUVIndexOpen(true);
  };

  const handleCloseUVIndex = () => {
    setIsUVIndexOpen(false);
  };

  const toggleAlertExpansion = (alertIndex: number) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertIndex)) {
        newSet.delete(alertIndex);
      } else {
        newSet.add(alertIndex);
      }
      return newSet;
    });
  };

  // Get LaunchDarkly flags - Following Rule 1: Centralized evaluation with predictable fallback
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
    // Get the base weather icon
    const baseIconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙', // Clear night - just moon
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    
    return baseIconMap[iconCode] || '🌡️';
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
              {!showForecast ? (
                // Current weather display
                <>
                  <div 
                    className={weather.icon.endsWith('n') ? "weather-icon weather-icon-night" : "weather-icon"}
                    title={weather.description}
                    onMouseEnter={() => setShowWeatherTooltip(true)}
                    onMouseLeave={() => setShowWeatherTooltip(false)}
                    onClick={handleWeatherIconClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {weather.icon.endsWith('n') && moonPhase && weather.icon !== '01n' ? (
                      <>
                        <span className="moon-phase">{moonPhase.icon}</span>
                        <span className="weather-overlay">{getWeatherIcon(weather.icon)}</span>
                      </>
                    ) : (
                      getWeatherIcon(weather.icon)
                    )}
                    {/* Rain indicator - only show for OpenWeather providers */}
                    {(weather.provider === 'openweathermap' || weather.provider === 'openweathermap-onecall') && weather.hasRain && (
                      <div className="weather-indicator rain-indicator" title="Rain expected">
                        💧
                      </div>
                    )}
                    {/* Alert indicator - only show for OpenWeather providers */}
                    {(weather.provider === 'openweathermap' || weather.provider === 'openweathermap-onecall') && weather.hasAlerts && (
                      <div className="weather-indicator alert-indicator" title="Weather alert active">
                        ⚠️
                      </div>
                    )}
                  </div>
                  {showWeatherTooltip && (
                    <div className="weather-tooltip">
                      <div className="weather-tooltip-content">
                        <strong>{weather.description}</strong>
                        <div className="weather-tooltip-details">
                          <small>Temperature: {formatTemperature(weather.temperature)}</small>
                          <small>Humidity: {weather.humidity}%</small>
                          <small>Wind: {formatWindSpeed(weather.windSpeed)}</small>
                          {/* Show rain probability if available */}
                          {(weather.provider === 'openweathermap' || weather.provider === 'openweathermap-onecall') && weather.hasRain && (
                            <small>🌧️ Rain expected</small>
                          )}
                          {/* Show alert info if available */}
                          {(weather.provider === 'openweathermap' || weather.provider === 'openweathermap-onecall') && weather.hasAlerts && weather.alerts && weather.alerts.length > 0 && (
                            <small>⚠️ {weather.alerts[0].event}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="weather-temp">{formatTemperature(weather.temperature)}</div>
                </>
              ) : (
                // Forecast display
                <>
                  <div className="forecast-container">
                    <div className="forecast-header">
                      <span className="forecast-title">5-Hour Forecast</span>
                      <button 
                        className="forecast-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowForecast(false);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="forecast-grid">
                      {forecastLoading ? (
                        <div className="forecast-loading">Loading forecast...</div>
                      ) : forecast.length > 0 ? (
                        forecast.map((hour, index) => (
                          <div 
                            key={index} 
                            className="forecast-square"
                          >
                            <div className="forecast-time">{hour.time}</div>
                            <div className={hour.icon.endsWith('n') ? "forecast-icon weather-icon-night" : "forecast-icon"}>
                              {hour.icon.endsWith('n') && moonPhase && hour.icon !== '01n' ? (
                                <>
                                  <span className="moon-phase">{moonPhase.icon}</span>
                                  <span className="weather-overlay">{getWeatherIcon(hour.icon)}</span>
                                </>
                              ) : (
                                getWeatherIcon(hour.icon)
                              )}
                              {/* Rain indicator for forecast hours */}
                              {hour.hasRain && (
                                <div className="forecast-rain-indicator" title={`${Math.round((hour.pop || 0) * 100)}% chance of rain`}>
                                  💧
                                </div>
                              )}
                            </div>
                            <div className="forecast-temp">{formatTemperature(hour.temperature)}</div>
                            
                            {/* Forecast tooltip - temporarily disabled to fix display issues */}
                            {/* {hoveredForecastIndex === index && (
                              <div className="forecast-tooltip">
                                <div className="forecast-tooltip-content">
                                  <div className="forecast-tooltip-time">{hour.time}</div>
                                  <div className="forecast-tooltip-description">{hour.description}</div>
                                  <div className="forecast-tooltip-details">
                                    <div className="forecast-tooltip-detail">
                                      <span className="detail-label">Temperature:</span>
                                      <span className="detail-value">{formatTemperature(hour.temperature)}</span>
                                    </div>
                                    <div className="forecast-tooltip-detail">
                                      <span className="detail-label">Humidity:</span>
                                      <span className="detail-value">{hour.humidity}%</span>
                                    </div>
                                    <div className="forecast-tooltip-detail">
                                      <span className="detail-label">Wind:</span>
                                      <span className="detail-value">{formatWindSpeed(hour.windSpeed)}</span>
                                    </div>
                                    {hour.hasRain && hour.pop && (
                                      <div className="forecast-tooltip-detail">
                                        <span className="detail-label">Rain Chance:</span>
                                        <span className="detail-value">{Math.round(hour.pop * 100)}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )} */}
                          </div>
                        ))
                      ) : (
                        <div className="forecast-error">No forecast data available</div>
                      )}
                    </div>
                    
                    {/* Weather Alerts Section */}
                    {(weather.provider === 'openweathermap' || weather.provider === 'openweathermap-onecall') && 
                     weather.hasAlerts && 
                     weather.alerts && 
                     weather.alerts.length > 0 && (
                      <div className="forecast-alerts">
                        <div className="forecast-alerts-header">
                          <span className="forecast-alerts-title">⚠️ WEATHER ALERTS</span>
                        </div>
                        <div className="forecast-alerts-content">
                          {weather.alerts.map((alert: any, alertIndex: number) => (
                            <div key={alertIndex} className="forecast-alert-item">
                              <div 
                                className="forecast-alert-header"
                                onClick={() => toggleAlertExpansion(alertIndex)}
                              >
                                <div className="forecast-alert-event">{alert.event}</div>
                                {alert.start && alert.end && (
                                  <div className="forecast-alert-time">
                                    <span className="alert-time-label">Active:</span>
                                    <span className="alert-time-value">
                                      {new Date(alert.start * 1000).toLocaleDateString()} {new Date(alert.start * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(alert.end * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                )}
                                <div className="forecast-alert-toggle">
                                  {expandedAlerts.has(alertIndex) ? '▼' : '▶'}
                                </div>
                              </div>
                              {expandedAlerts.has(alertIndex) && (
                                <div className="forecast-alert-description">
                                  {alert.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                
                {/* Enhanced Weather Data Buttons */}
                {weather.airQuality && (
                  <div className="detail-row enhanced-data">
                    <span className="detail-label">AIR QUALITY:</span>
                    <button 
                      className="enhanced-data-button air-quality-button"
                      onClick={handleOpenAirQuality}
                      title={`${weather.airQuality.category} (${weather.airQuality.index})`}
                    >
                      {weather.airQuality.index} - {weather.airQuality.category}
                    </button>
                  </div>
                )}
                
                {weather.uvIndex && (
                  <div className="detail-row enhanced-data">
                    <span className="detail-label">UV INDEX:</span>
                    <button 
                      className="enhanced-data-button uv-index-button"
                      onClick={handleOpenUVIndex}
                      title={`${weather.uvIndex.risk} risk`}
                    >
                      {weather.uvIndex.value} - {weather.uvIndex.risk}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Moon Phase Display */}
            {moonPhase && getShowMoonPhase() && (
              <div className="moon-phase-section">
                <div className="moon-phase-icon" title={moonPhase.description}>
                  {moonPhase.icon}
                </div>
                <div className="moon-phase-detail">
                  <span className="moon-phase-label">MOON:</span>
                  <span className="moon-phase-value">{moonPhase.description}</span>
                </div>
              </div>
            )}

            <div className="terminal-footer">
              <div className="timestamp">
                LAST UPDATE: {lastUpdated && formatTime(lastUpdated)}
              </div>
              <div className="button-group">
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
      
      {/* Enhanced Weather Data Modals */}
      {weather?.airQuality && (
        <AirQualityModal
          isOpen={isAirQualityOpen}
          onClose={handleCloseAirQuality}
          airQuality={weather.airQuality}
        />
      )}
      
      {weather?.uvIndex && (
        <UVIndexModal
          isOpen={isUVIndexOpen}
          onClose={handleCloseUVIndex}
          uvIndex={weather.uvIndex}
        />
      )}
    </div>
  );
};

export default WeatherWidget; 