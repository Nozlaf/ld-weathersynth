import WeatherDebugService from './weatherDebugService';
import locationSimulationService from './locationSimulationService';

export interface WeatherData {
  temperature: number;
  description: string;
  location: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface Location {
  lat: number;
  lon: number;
}

const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const weatherDebug = WeatherDebugService.getInstance();

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

export const getWeatherData = async (location: Location): Promise<WeatherData> => {
  if (!OPENWEATHER_API_KEY) {
    // Return mock data if no API key is provided
    weatherDebug.updateRequestInfo('No API request (Mock Mode)', 'Mock Data', 0);
    return {
      temperature: 22,
      description: 'Sunny',
      location: 'Demo City',
      humidity: 65,
      windSpeed: 12,
      icon: '01d',
    };
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const startTime = Date.now();

  try {
    const response = await fetch(apiUrl);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      weatherDebug.updateRequestInfo(apiUrl, `HTTP ${response.status}`, responseTime);
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    weatherDebug.updateRequestInfo(apiUrl, `Success (${response.status})`, responseTime);

    const weatherData = {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      icon: data.weather[0].icon,
    };

    // Update location info with actual city name from API
    weatherDebug.updateLocationInfo(
      weatherDebug.getDebugInfo().location.method, 
      location, 
      weatherData.location, 
      weatherDebug.getDebugInfo().location.fallbackUsed
    );

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    const responseTime = Date.now() - startTime;
    weatherDebug.updateRequestInfo(apiUrl, `Error: ${error}`, responseTime);
    
    // Return fallback data
    return {
      temperature: 20,
      description: 'Unknown',
      location: 'Unknown Location',
      humidity: 50,
      windSpeed: 10,
      icon: '01d',
    };
  }
};

export const getCurrentWeather = async (): Promise<WeatherData> => {
  const location = await getCurrentLocation();
  return getWeatherData(location);
}; 