import WeatherDebugService from './weatherDebugService';
import locationSimulationService from './locationSimulationService';
import { reIdentifyWithLocation } from './launchDarklyConfig';

export interface WeatherData {
  temperature: number;
  description: string;
  location: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface WeatherAPIError {
  code: number;
  message: string;
  type: 'API_KEY_INVALID' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
}

export interface Location {
  lat: number;
  lon: number;
}

const weatherDebug = WeatherDebugService.getInstance();

// Backend API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Same origin in production 
  : process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'; // Backend server in development

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    console.log('🔍 DEBUG: getCurrentLocation called');
    
    // Check for location simulation override first
    const simulationOverride = locationSimulationService.getLocationOverride();
    console.log('🔍 DEBUG: Location simulation override check result:', simulationOverride);
    
    if (simulationOverride) {
      const location = {
        lat: simulationOverride.lat,
        lon: simulationOverride.lon,
      };
      console.log('🔍 DEBUG: Using location simulation override:', location);
      weatherDebug.updateLocationInfo('Location Simulation', location, simulationOverride.locationName, false);
      resolve(location);
      return;
    }

    console.log('🔍 DEBUG: No location simulation override, using geolocation');
    
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        console.log('🔍 DEBUG: Geolocation obtained:', location);
        weatherDebug.updateLocationInfo('Geolocation API', location, undefined, false);
        resolve(location);
      },
      (error) => {
        // Fallback to a default location (New York) if geolocation fails
        console.warn('Geolocation failed, using default location:', error);
        const fallbackLocation = { lat: 40.7128, lon: -74.0060 };
        console.log('🔍 DEBUG: Using fallback location:', fallbackLocation);
        weatherDebug.updateLocationInfo('Fallback (Geolocation Failed)', fallbackLocation, 'New York, NY', true);
        resolve(fallbackLocation);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export const getWeatherData = async (location: Location, ldClient?: any): Promise<WeatherData> => {
  // Get user context from LaunchDarkly client
  const userContext = ldClient?.getContext ? ldClient.getContext() : null;
  
  // Build API URL with user context parameters
  const baseUrl = `${API_BASE_URL}/api/weather?lat=${location.lat}&lon=${location.lon}`;
  const userParams = new URLSearchParams();
  
  if (userContext) {
    if (userContext.key) userParams.append('userKey', userContext.key);
    if (userContext.name) userParams.append('userName', userContext.name);
    if (userContext.email) userParams.append('userEmail', userContext.email);
  }
  
  const apiUrl = userParams.toString() ? `${baseUrl}&${userParams.toString()}` : baseUrl;
  const internalStartTime = Date.now();

  try {
    const response = await fetch(apiUrl);
    const internalLatency = Date.now() - internalStartTime;

    if (!response.ok) {
      weatherDebug.updateRequestInfo(apiUrl, `HTTP ${response.status}`, internalLatency);
      
      // Track internal latency for error response to LaunchDarkly
      if (ldClient && ldClient.track) {
        ldClient.track('internal_latency', {
          latency_ms: internalLatency,
          endpoint: '/api/weather',
          success: false,
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Handle specific API errors
      if (response.status === 401 || response.status === 500) {
        const errorData = await response.json().catch(() => ({ message: 'API configuration error' }));
        const apiError: WeatherAPIError = {
          code: response.status,
          message: errorData.message || 'Weather service temporarily unavailable',
          type: 'API_KEY_INVALID'
        };
        throw apiError;
      }
      
      // Handle other HTTP errors
      const genericError: WeatherAPIError = {
        code: response.status,
        message: `HTTP ${response.status}`,
        type: 'NETWORK_ERROR'
      };
      throw genericError;
    }

    const weatherData = await response.json();
    weatherDebug.updateRequestInfo(apiUrl, `Success (${response.status})`, internalLatency);

    // Track internal latency for successful response to LaunchDarkly
    if (ldClient && ldClient.track) {
      ldClient.track('internal_latency', {
        latency_ms: internalLatency,
        endpoint: '/api/weather',
        success: true,
        cached: weatherData.cached || false,
        provider: weatherData.provider,
        upstream_latency: weatherData.upstreamLatency,
        timestamp: new Date().toISOString()
      });
    }

    // Check if we received mock data
    if (weatherData.mockData) {
      weatherDebug.updateRequestInfo(apiUrl, 'Success (Mock Data)', internalLatency);
    }

    // Update location info with actual city name from API
    weatherDebug.updateLocationInfo(
      weatherDebug.getDebugInfo().location.method, 
      location, 
      weatherData.location, 
      weatherDebug.getDebugInfo().location.fallbackUsed
    );

    // Re-identify with LaunchDarkly using the location context and night time detection
    if (ldClient && weatherData.location) {
      reIdentifyWithLocation(ldClient, weatherData.location, weatherData.icon);
    }

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    const internalLatency = Date.now() - internalStartTime;
    weatherDebug.updateRequestInfo(apiUrl, `Error: ${error}`, internalLatency);
    
    // Track internal latency for error response to LaunchDarkly
    if (ldClient && ldClient.track) {
      ldClient.track('internal_latency', {
        latency_ms: internalLatency,
        endpoint: '/api/weather',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    
    // Re-throw WeatherAPIError objects to be handled by the component
    if (error && typeof error === 'object' && 'type' in error) {
      throw error as WeatherAPIError;
    }
    
    // For other errors, create a generic error object
    const genericError: WeatherAPIError = {
      code: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: 'UNKNOWN_ERROR'
    };
    throw genericError;
  }
};

export const getCurrentWeather = async (ldClient?: any): Promise<WeatherData> => {
  const location = await getCurrentLocation();
  return getWeatherData(location, ldClient);
};

// New function to get cached weather data from server
export const getCachedWeatherData = async (): Promise<any> => {
  const apiUrl = `${API_BASE_URL}/api/weather/cache`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cached weather data: HTTP ${response.status}`);
    }
    
    const cachedData = await response.json();
    return cachedData;
  } catch (error) {
    console.error('Failed to fetch cached weather data:', error);
    throw error;
  }
}; 