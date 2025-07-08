const fetch = require('node-fetch');

/**
 * Weather API Providers Configuration
 * Each provider implements the same interface for consistency
 */
class WeatherProviders {
  constructor() {
    this.providers = {
      'openweathermap': new OpenWeatherMapProvider(),
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

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformData(data);
  }

  transformData(data) {
    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      icon: data.weather[0].icon,
      provider: this.name,
      mockData: false
    };
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
    return process.env.WEATHERAPI_KEY;
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
    return this.transformData(data);
  }

  transformData(data) {
    const current = data.currentConditions;
    
    return {
      temperature: Math.round(current.temp),
      description: current.conditions,
      location: data.resolvedAddress,
      humidity: current.humidity,
      windSpeed: Math.round(current.windspeed),
      icon: this.mapVisualCrossingIcon(current.icon),
      provider: this.name,
      mockData: false
    };
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