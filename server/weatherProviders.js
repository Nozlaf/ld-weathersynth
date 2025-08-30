const fetch = require('node-fetch');

/**
 * Weather API Providers Configuration
 * Each provider implements the same interface for consistency
 */
class WeatherProviders {
  constructor() {
    this.providers = {
      'openweathermap': new OpenWeatherMapProvider(),
      'openweathermap-onecall': new OpenWeatherMapOneCallProvider(),
      'tomorrow-io': new TomorrowIOProvider(),
      'weatherapi': new WeatherAPIProvider(),
      'visual-crossing': new VisualCrossingProvider(),
      'open-meteo': new OpenMeteoProvider()
    };
  }

  /**
   * Get weather data from the specified provider
   * @param {string} providerName - The name of the weather provider
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Standardized weather data
   */
  async getWeather(providerName, lat, lon) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Weather provider '${providerName}' not found`);
    }

    return provider.getWeather(lat, lon);
  }

  /**
   * Get forecast data from the specified provider
   * @param {string} providerName - The name of the weather provider
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Standardized forecast data
   */
  async getForecast(providerName, lat, lon) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Weather provider '${providerName}' not found`);
    }

    // Check if the provider has a getForecast method
    if (typeof provider.getForecast === 'function') {
      return provider.getForecast(lat, lon);
    }

    // If provider doesn't support forecast, throw an error so the fallback logic can try the next provider
    throw new Error(`Provider ${providerName} doesn't support forecast`);
  }

  /**
   * Check if a provider is available (has API key if required)
   * @param {string} providerName - The name of the weather provider
   * @returns {boolean} True if provider is available
   */
  isProviderAvailable(providerName) {
    const provider = this.providers[providerName];
    return provider && provider.isAvailable();
  }

  /**
   * Get list of available providers
   * @returns {Array<string>} Array of available provider names
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter(name => this.isProviderAvailable(name));
  }
}

/**
 * Base Weather Provider Class
 * All providers should extend this class
 */
class BaseWeatherProvider {
  constructor(name, requiresApiKey = true) {
    this.name = name;
    this.requiresApiKey = requiresApiKey;
  }

  isAvailable() {
    if (!this.requiresApiKey) return true;
    return !!this.getApiKey();
  }

  getApiKey() {
    // Override in subclasses
    return null;
  }

  async getWeather(lat, lon) {
    throw new Error('getWeather method must be implemented by subclass');
  }

  /**
   * Transform provider-specific data to standardized format
   * @param {Object} data - Provider-specific weather data
   * @returns {Object} Standardized weather data
   */
  transformData(data) {
    throw new Error('transformData method must be implemented by subclass');
  }
}

/**
 * OpenWeatherMap Provider
 */
class OpenWeatherMapProvider extends BaseWeatherProvider {
  constructor() {
    super('openweathermap', true);
  }

  getApiKey() {
    return process.env.OPENWEATHER_API_KEY;
  }

  async getWeather(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // Use OpenWeatherMap API 2.5 for current weather (compatible with free tier)
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    try {
      const weatherResponse = await fetch(weatherApiUrl);
      
      if (!weatherResponse.ok) {
        throw new Error(`OpenWeatherMap API error: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      return this.transformData(weatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getForecast(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // Use One Call API 3.0 for hourly forecast
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily&appid=${apiKey}&units=metric`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformForecastData(data);
  }

  transformData(data) {
    // API 2.5 format: data.main, data.weather[0], data.sys, data.name
    const main = data.main;
    const weather = data.weather[0];
    const sys = data.sys;
    
    return {
      temperature: Math.round(main.temp),
      description: weather.description,
      location: `${data.name || 'Unknown'}, ${sys?.country || 'Unknown'}`,
      humidity: main.humidity,
      windSpeed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
      icon: weather.icon,
      provider: this.name,
      mockData: false,
      // Note: API 2.5 doesn't provide hourly forecast or alerts
      hasRain: weather.main === 'Rain' || weather.main === 'Drizzle',
      hasAlerts: false,
      alerts: [],
      hourlyForecast: []
    };
  }

  transformForecastData(data) {
    if (!data.hourly || data.hourly.length === 0) {
      throw new Error('No hourly forecast data available');
    }

    return data.hourly.slice(0, 5).map(hour => ({
      time: new Date(hour.dt * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      temperature: Math.round(hour.temp),
      description: hour.weather[0].description,
      icon: hour.weather[0].icon,
      humidity: hour.humidity,
      windSpeed: Math.round(hour.wind_speed * 3.6),
      // Check if this hour has rain
      hasRain: hour.weather[0].main === 'Rain' || hour.weather[0].main === 'Drizzle',
      pop: hour.pop // Probability of precipitation
    }));
  }
}

/**
 * OpenWeatherMap One Call API 3.0 Provider
 * Requires separate subscription to "One Call by Call" plan
 */
class OpenWeatherMapOneCallProvider extends BaseWeatherProvider {
  constructor() {
    super('openweathermap-onecall', true);
  }

  getApiKey() {
    return process.env.OPENWEATHER_API_KEY;
  }

  async getWeather(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // Use One Call API 3.0 for current weather and hourly forecast
    const weatherApiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily&appid=${apiKey}&units=metric`;
    
    // Get city name using reverse geocoding
    const geocodingApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    
    try {
      // Make both API calls in parallel
      const [weatherResponse, geocodingResponse] = await Promise.all([
        fetch(weatherApiUrl),
        fetch(geocodingApiUrl)
      ]);
      
      if (!weatherResponse.ok) {
        throw new Error(`OpenWeatherMap One Call API error: ${weatherResponse.status}`);
      }
      
      const weatherData = await weatherResponse.json();
      const geocodingData = await geocodingResponse.json();
      
      // Add city name to weather data
      if (geocodingData && geocodingData.length > 0) {
        weatherData.name = geocodingData[0].name;
        weatherData.sys = { country: geocodingData[0].country };
      }
      
      return this.transformData(weatherData);
    } catch (error) {
      console.error('Error fetching weather or geocoding data:', error);
      throw error;
    }
  }

  async getForecast(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // Use One Call API 3.0 for hourly forecast
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily&appid=${apiKey}&units=metric`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap One Call API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformForecastData(data);
  }

  transformData(data) {
    const current = data.current;
    const hourly = data.hourly || [];
    
    // Check for rain in next few hours
    const hasRain = hourly.slice(0, 3).some(hour => 
      hour.weather[0].main === 'Rain' || hour.weather[0].main === 'Drizzle'
    );
    
    // Check for weather alerts
    const hasAlerts = data.alerts && data.alerts.length > 0;
    
    // Process air quality data (One Call API includes this)
    let airQuality = null;
    if (data.current && data.current.air_quality) {
      const aq = data.current.air_quality;
      airQuality = {
        index: aq['us-epa-index'],
        category: this.getAQICategory(aq['us-epa-index']),
        pollutants: {
          pm25: aq.pm2_5,
          pm10: aq.pm10,
          o3: aq.o3,
          no2: aq.no2,
          so2: aq.so2,
          co: aq.co
        }
      };
    }
    
    // Process UV index data (One Call API includes this)
    let uvIndex = null;
    if (data.current && data.current.uvi !== undefined) {
      uvIndex = {
        value: data.current.uvi,
        risk: this.getUVRisk(data.current.uvi),
        protection: this.getUVProtection(data.current.uvi)
      };
    }
    
    return {
      temperature: Math.round(current.temp),
      description: current.weather[0].description,
      location: `${data.name || 'Unknown'}, ${data.sys?.country || 'Unknown'}`,
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_speed * 3.6), // Convert m/s to km/h
      icon: current.weather[0].icon,
      provider: this.name,
      mockData: false,
      // Enhanced features available with One Call API
      hasRain: hasRain,
      hasAlerts: hasAlerts,
      alerts: data.alerts || [],
      hourlyForecast: hourly.slice(0, 5), // First 5 hours for forecast
      // Enhanced data
      airQuality,
      uvIndex
    };
  }

  getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  getUVRisk(uvValue) {
    if (uvValue <= 2) return 'Low';
    if (uvValue <= 5) return 'Moderate';
    if (uvValue <= 7) return 'High';
    if (uvValue <= 10) return 'Very High';
    return 'Extreme';
  }

  getUVProtection(uvValue) {
    if (uvValue <= 2) return ['No protection required', 'You can safely stay outside'];
    if (uvValue <= 5) return ['Seek shade during midday hours', 'Slip on a shirt, slop on sunscreen', 'Slap on a hat'];
    if (uvValue <= 7) return ['Reduce time in the sun between 10 a.m. and 4 p.m.', 'Wear protective clothing', 'Apply sunscreen SPF 30+'];
    if (uvValue <= 10) return ['Minimize sun exposure during midday hours', 'Wear protective clothing', 'Apply sunscreen SPF 30+', 'Seek shade'];
    return ['Avoid sun exposure during midday hours', 'Take all precautions', 'Unprotected skin will burn quickly'];
  }

  transformForecastData(data) {
    const hourly = data.hourly || [];
    const timezoneOffset = data.timezone_offset || 0; // Get timezone offset from API
    
    return hourly.slice(0, 5).map(hour => {
      // Convert UTC timestamp to local time using timezone offset
      const localTime = new Date((hour.dt + timezoneOffset) * 1000);
      
      return {
        time: localTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        }),
        temperature: Math.round(hour.temp),
        description: hour.weather[0].description,
        icon: hour.weather[0].icon,
        humidity: hour.humidity,
        windSpeed: Math.round(hour.wind_speed * 3.6),
        // Check if this hour has rain
        hasRain: hour.weather[0].main === 'Rain' || hour.weather[0].main === 'Drizzle',
        pop: hour.pop // Probability of precipitation
      };
    });
  }
}

/**
 * Tomorrow.io Provider
 */
class TomorrowIOProvider extends BaseWeatherProvider {
  constructor() {
    super('tomorrow-io', true);
  }

  getApiKey() {
    return process.env.TOMORROW_API_KEY;
  }

  async getWeather(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tomorrow.io API key not configured');
    }

    const apiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformData(data);
  }

  transformData(data) {
    const values = data.data.values;
    const location = data.location;
    
    // Map weather codes to descriptions (simplified)
    const weatherCodeMap = {
      1000: 'Clear',
      1100: 'Mostly Clear',
      1101: 'Partly Cloudy',
      1102: 'Mostly Cloudy',
      1001: 'Cloudy',
      2000: 'Fog',
      4000: 'Drizzle',
      4001: 'Rain',
      4200: 'Light Rain',
      4201: 'Heavy Rain',
      5000: 'Snow',
      5001: 'Flurries',
      5100: 'Light Snow',
      5101: 'Heavy Snow',
      6000: 'Freezing Drizzle',
      6001: 'Freezing Rain',
      6200: 'Light Freezing Rain',
      6201: 'Heavy Freezing Rain',
      7000: 'Ice Pellets',
      7101: 'Heavy Ice Pellets',
      7102: 'Light Ice Pellets',
      8000: 'Thunderstorm'
    };

    return {
      temperature: Math.round(values.temperature),
      description: weatherCodeMap[values.weatherCode] || 'Unknown',
      location: location.name || `${location.lat}, ${location.lon}`,
      humidity: values.humidity,
      windSpeed: Math.round(values.windSpeed * 3.6), // Convert m/s to km/h
      icon: this.mapWeatherCodeToIcon(values.weatherCode),
      provider: this.name,
      mockData: false
    };
  }

  mapWeatherCodeToIcon(code) {
    // Map Tomorrow.io weather codes to OpenWeatherMap-style icons
    const iconMap = {
      1000: '01d', // Clear
      1100: '02d', // Mostly Clear
      1101: '03d', // Partly Cloudy
      1102: '04d', // Mostly Cloudy
      1001: '04d', // Cloudy
      2000: '50d', // Fog
      4000: '09d', // Drizzle
      4001: '10d', // Rain
      4200: '10d', // Light Rain
      4201: '10d', // Heavy Rain
      5000: '13d', // Snow
      5001: '13d', // Flurries
      5100: '13d', // Light Snow
      5101: '13d', // Heavy Snow
      8000: '11d'  // Thunderstorm
    };
    return iconMap[code] || '01d';
  }
}

/**
 * WeatherAPI.com Provider
 */
class WeatherAPIProvider extends BaseWeatherProvider {
  constructor() {
    super('weatherapi', true);
  }

  getApiKey() {
    return process.env.WEATHERAPI_API_KEY;
  }

  async getWeather(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('WeatherAPI key not configured');
    }

    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformData(data);
  }

  async getForecast(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('WeatherAPI key not configured');
    }

    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1&aqi=no`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`WeatherAPI forecast error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformForecastData(data);
  }

  transformData(data) {
    return {
      temperature: Math.round(data.current.temp_c),
      description: data.current.condition.text,
      location: `${data.location.name}, ${data.location.country}`,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_kph),
      icon: this.mapWeatherAPIIcon(data.current.condition.code),
      provider: this.name,
      mockData: false
    };
  }

  transformForecastData(data) {
    const hourly = data.forecast?.forecastday[0]?.hour || [];
    
    return hourly.slice(0, 5).map(hour => ({
      time: new Date(hour.time).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      }),
      temperature: Math.round(hour.temp_c),
      description: hour.condition.text,
      icon: this.mapWeatherAPIIcon(hour.condition.code),
      humidity: hour.humidity,
      windSpeed: Math.round(hour.wind_kph),
      hasRain: hour.chance_of_rain > 0,
      pop: hour.chance_of_rain / 100 // Convert percentage to decimal
    }));
  }

  mapWeatherAPIIcon(code) {
    // Map WeatherAPI condition codes to OpenWeatherMap-style icons
    const iconMap = {
      1000: '01d', // Sunny/Clear
      1003: '02d', // Partly cloudy
      1006: '03d', // Cloudy
      1009: '04d', // Overcast
      1030: '50d', // Mist
      1063: '10d', // Patchy rain possible
      1066: '13d', // Patchy snow possible
      1069: '13d', // Patchy sleet possible
      1072: '09d', // Patchy freezing drizzle possible
      1087: '11d', // Thundery outbreaks possible
      1114: '13d', // Blowing snow
      1117: '13d', // Blizzard
      1135: '50d', // Fog
      1147: '50d', // Freezing fog
      1150: '09d', // Patchy light drizzle
      1153: '09d', // Light drizzle
      1168: '09d', // Freezing drizzle
      1171: '09d', // Heavy freezing drizzle
      1180: '10d', // Patchy light rain
      1183: '10d', // Light rain
      1186: '10d', // Moderate rain at times
      1189: '10d', // Moderate rain
      1192: '10d', // Heavy rain at times
      1195: '10d', // Heavy rain
      1198: '10d', // Light freezing rain
      1201: '10d', // Moderate or heavy freezing rain
      1204: '13d', // Light sleet
      1207: '13d', // Moderate or heavy sleet
      1210: '13d', // Patchy light snow
      1213: '13d', // Light snow
      1216: '13d', // Patchy moderate snow
      1219: '13d', // Moderate snow
      1222: '13d', // Patchy heavy snow
      1225: '13d', // Heavy snow
      1237: '13d', // Ice pellets
      1240: '10d', // Light rain shower
      1243: '10d', // Moderate or heavy rain shower
      1246: '10d', // Torrential rain shower
      1249: '13d', // Light sleet showers
      1252: '13d', // Moderate or heavy sleet showers
      1255: '13d', // Light snow showers
      1258: '13d', // Moderate or heavy snow showers
      1261: '13d', // Light showers of ice pellets
      1264: '13d', // Moderate or heavy showers of ice pellets
      1273: '11d', // Patchy light rain with thunder
      1276: '11d', // Moderate or heavy rain with thunder
      1279: '11d', // Patchy light snow with thunder
      1282: '11d'  // Moderate or heavy snow with thunder
    };
    return iconMap[code] || '01d';
  }
}

/**
 * Visual Crossing Provider
 */
class VisualCrossingProvider extends BaseWeatherProvider {
  constructor() {
    super('visual-crossing', true);
  }

  getApiKey() {
    return process.env.VISUAL_CROSSING_API_KEY;
  }

  async getWeather(lat, lon) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Visual Crossing API key not configured');
    }

    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&include=current&key=${apiKey}&contentType=json`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Visual Crossing API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformData(data, lat, lon);
  }

  async transformData(data, lat, lon) {
    const current = data.currentConditions;
    let location = data.resolvedAddress;

    // If Visual Crossing only returns coordinates, try to get a better location name
    // Check if location looks like coordinates (contains numbers, commas, and optional minus signs)
    const coordinatePattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordinatePattern.test(location)) {
      try {
        location = await this.reverseGeocode(lat, lon);
      } catch (error) {
        // If reverse geocoding fails, use coordinates as fallback
        console.warn('Reverse geocoding failed, using coordinates:', error.message);
        location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }
    
    return {
      temperature: Math.round(current.temp),
      description: current.conditions,
      location: location,
      humidity: current.humidity,
      windSpeed: Math.round(current.windspeed),
      icon: this.mapVisualCrossingIcon(current.icon),
      provider: this.name,
      mockData: false
    };
  }

  /**
   * Simple reverse geocoding using OpenStreetMap Nominatim (free service)
   * This provides a fallback when Visual Crossing doesn't return a proper location name
   */
  async reverseGeocode(lat, lon) {
    try {
      // Add a small delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'WeatherSynthApp/1.0 (https://github.com/weather-synth/weather-synth)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 5000 // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract location name from Nominatim response
      if (data && data.address) {
        const { city, town, village, county, state, country } = data.address;
        const locationName = city || town || village || county || 'Unknown Location';
        const stateName = state ? `, ${state}` : '';
        const countryName = country && country !== 'United States' ? `, ${country}` : '';
        
        return `${locationName}${stateName}${countryName}`;
      }
      
      // If no address found, return formatted coordinates
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error.message);
      // Return formatted coordinates as fallback
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  mapVisualCrossingIcon(icon) {
    // Map Visual Crossing icons to OpenWeatherMap-style icons
    const iconMap = {
      'clear-day': '01d',
      'clear-night': '01n',
      'partly-cloudy-day': '02d',
      'partly-cloudy-night': '02n',
      'cloudy': '04d',
      'fog': '50d',
      'wind': '50d',
      'rain': '10d',
      'snow': '13d',
      'snow-showers-day': '13d',
      'snow-showers-night': '13n',
      'thunder-rain': '11d',
      'thunder-showers-day': '11d',
      'thunder-showers-night': '11n',
      'showers-day': '09d',
      'showers-night': '09n'
    };
    return iconMap[icon] || '01d';
  }
}

/**
 * Open-Meteo Provider (Free, no API key required)
 */
class OpenMeteoProvider extends BaseWeatherProvider {
  constructor() {
    super('open-meteo', false); // No API key required
  }

  async getWeather(lat, lon) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformData(data);
  }

  transformData(data) {
    const current = data.current;
    
    return {
      temperature: Math.round(current.temperature_2m),
      description: this.getWeatherDescription(current.weather_code),
      location: `${data.latitude}, ${data.longitude}`,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m * 3.6), // Convert m/s to km/h
      icon: this.mapOpenMeteoIcon(current.weather_code),
      provider: this.name,
      mockData: false
    };
  }

  async getForecast(lat, lon) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&forecast_hours=5`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Open-Meteo forecast API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformForecastData(data);
  }

  transformForecastData(data) {
    const hourly = data.hourly;
    const forecast = [];
    
    // Get the first 5 hours from the API response
    for (let i = 0; i < 5 && i < hourly.time.length; i++) {
      const hourData = {
        time: this.formatHour(hourly.time[i]),
        temperature: Math.round(hourly.temperature_2m[i]),
        description: this.getWeatherDescription(hourly.weather_code[i]),
        icon: this.mapOpenMeteoIcon(hourly.weather_code[i]),
        humidity: hourly.relative_humidity_2m[i],
        windSpeed: Math.round(hourly.wind_speed_10m[i] * 3.6) // Convert m/s to km/h
      };
      forecast.push(hourData);
    }
    
    console.log(`Generated forecast with ${forecast.length} hours:`, forecast);
    
    return {
      forecast: forecast,
      provider: this.name,
      location: `${data.latitude}, ${data.longitude}`,
      timestamp: new Date().toISOString()
    };
  }

  formatHour(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getWeatherDescription(code) {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
  }

  mapOpenMeteoIcon(code) {
    // Map Open-Meteo weather codes to OpenWeatherMap-style icons
    const iconMap = {
      0: '01d',  // Clear sky
      1: '02d',  // Mainly clear
      2: '03d',  // Partly cloudy
      3: '04d',  // Overcast
      45: '50d', // Fog
      48: '50d', // Depositing rime fog
      51: '09d', // Light drizzle
      53: '09d', // Moderate drizzle
      55: '09d', // Dense drizzle
      56: '09d', // Light freezing drizzle
      57: '09d', // Dense freezing drizzle
      61: '10d', // Slight rain
      63: '10d', // Moderate rain
      65: '10d', // Heavy rain
      66: '10d', // Light freezing rain
      67: '10d', // Heavy freezing rain
      71: '13d', // Slight snow fall
      73: '13d', // Moderate snow fall
      75: '13d', // Heavy snow fall
      77: '13d', // Snow grains
      80: '10d', // Slight rain showers
      81: '10d', // Moderate rain showers
      82: '10d', // Violent rain showers
      85: '13d', // Slight snow showers
      86: '13d', // Heavy snow showers
      95: '11d', // Thunderstorm
      96: '11d', // Thunderstorm with slight hail
      99: '11d'  // Thunderstorm with heavy hail
    };
    return iconMap[code] || '01d';
  }
}

module.exports = WeatherProviders; 