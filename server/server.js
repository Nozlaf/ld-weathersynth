const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fetch = require('node-fetch');
const WeatherProviders = require('./weatherProviders');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize weather providers
const weatherProviders = new WeatherProviders();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://clientstream.launchdarkly.com", "https://events.launchdarkly.com", "https://app.launchdarkly.com", "https://api.farmsense.net", "https://observability.app.launchdarkly.com", "https://pub.observability.app.launchdarkly.com", "https://otel.observability.app.launchdarkly.com", "https://www.google-analytics.com"],
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://weather.imadethis.site', 'http://localhost:3000'] 
    : true,
  credentials: true
}));

app.use(express.json());

// Rate limiting for API endpoints
const apiRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per IP

// Weather data caching
const weatherCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Generate cache key from coordinates
const getCacheKey = (lat, lon) => {
  // Round coordinates to reduce cache fragmentation for nearby locations
  const roundedLat = Math.round(lat * 100) / 100; // 2 decimal places
  const roundedLon = Math.round(lon * 100) / 100; // 2 decimal places
  return `${roundedLat},${roundedLon}`;
};

// Check if cached data is still valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
};

// Clean up expired cache entries
const cleanupExpiredCache = () => {
  let cleanedCount = 0;
  weatherCache.forEach((entry, key) => {
    if (!isCacheValid(entry)) {
      weatherCache.delete(key);
      cleanedCount++;
    }
  });
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`);
  }
};

// Run cache cleanup every 30 minutes
setInterval(cleanupExpiredCache, 30 * 60 * 1000);

/**
 * Get weather provider configuration from LaunchDarkly feature flag
 * Default format: {"primary": "openweathermap", "fallback": "open-meteo"}
 */
const getWeatherProviderConfig = (ldFlag = null) => {
  // Default configuration
  const defaultConfig = {
    primary: 'openweathermap',
    fallback: 'open-meteo'
  };

  // If no LaunchDarkly flag provided, return default
  if (!ldFlag) {
    return defaultConfig;
  }

  // Try to parse LaunchDarkly flag if it's a string
  try {
    const config = typeof ldFlag === 'string' ? JSON.parse(ldFlag) : ldFlag;
    
    // Validate configuration structure
    if (config && typeof config === 'object' && config.primary) {
      return {
        primary: config.primary,
        fallback: config.fallback || 'open-meteo'
      };
    }
  } catch (error) {
    console.warn('Invalid weather provider configuration from LaunchDarkly, using default:', error);
  }

  return defaultConfig;
};

/**
 * Get weather data using the configured provider with fallback support
 */
const getWeatherWithFallback = async (lat, lon, ldFlag = null) => {
  const config = getWeatherProviderConfig(ldFlag);
  const availableProviders = weatherProviders.getAvailableProviders();
  
  console.log(`Weather provider config: ${JSON.stringify(config)}`);
  console.log(`Available providers: ${availableProviders.join(', ')}`);

  // Try primary provider first
  if (availableProviders.includes(config.primary)) {
    try {
      console.log(`Attempting to use primary provider: ${config.primary}`);
      const data = await weatherProviders.getWeather(config.primary, lat, lon);
      console.log(`Successfully fetched weather from primary provider: ${config.primary}`);
      return data;
    } catch (error) {
      console.error(`Primary provider ${config.primary} failed:`, error.message);
    }
  } else {
    console.log(`Primary provider ${config.primary} not available`);
  }

  // Try fallback provider
  if (config.fallback && availableProviders.includes(config.fallback)) {
    try {
      console.log(`Attempting to use fallback provider: ${config.fallback}`);
      const data = await weatherProviders.getWeather(config.fallback, lat, lon);
      console.log(`Successfully fetched weather from fallback provider: ${config.fallback}`);
      return data;
    } catch (error) {
      console.error(`Fallback provider ${config.fallback} failed:`, error.message);
    }
  } else if (config.fallback) {
    console.log(`Fallback provider ${config.fallback} not available`);
  }

  // If both primary and fallback fail, try any available provider
  for (const provider of availableProviders) {
    if (provider !== config.primary && provider !== config.fallback) {
      try {
        console.log(`Attempting to use emergency provider: ${provider}`);
        const data = await weatherProviders.getWeather(provider, lat, lon);
        console.log(`Successfully fetched weather from emergency provider: ${provider}`);
        return data;
      } catch (error) {
        console.error(`Emergency provider ${provider} failed:`, error.message);
      }
    }
  }

  // If all providers fail, return mock data
  console.log('All weather providers failed, returning mock data');
  return {
    temperature: 22,
    description: 'Sunny (Mock Data)',
    location: 'Demo City, XX',
    humidity: 65,
    windSpeed: 12,
    icon: '01d',
    provider: 'mock',
    mockData: true
  };
};

const rateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!apiRequestCounts.has(clientIP)) {
    apiRequestCounts.set(clientIP, []);
  }
  
  const requests = apiRequestCounts.get(clientIP);
  // Remove requests older than the window
  while (requests.length > 0 && requests[0] < now - RATE_LIMIT_WINDOW) {
    requests.shift();
  }
  
  if (requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }
  
  requests.push(now);
  next();
};

// Weather API proxy endpoint
app.get('/api/weather', rateLimit, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Validate input parameters
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Latitude and longitude are required'
      });
    }
    
    // Validate coordinate ranges
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Invalid latitude or longitude values'
      });
    }
    
    // Check cache first
    const cacheKey = getCacheKey(latitude, longitude);
    const cachedData = weatherCache.get(cacheKey);
    
    if (isCacheValid(cachedData)) {
      console.log(`Cache hit for ${cacheKey}, returning cached data`);
      return res.json({
        ...cachedData.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cachedData.timestamp) / 1000) // age in seconds
      });
    }
    
    console.log(`Cache miss for ${cacheKey}, fetching weather data using configured providers`);
    
    // Get weather provider configuration from LaunchDarkly flag (if provided)
    // In a real implementation, you would fetch this from LaunchDarkly here
    // For now, we'll use a default configuration or environment variable
    const weatherProviderFlag = process.env.WEATHER_PROVIDER_CONFIG ? 
      JSON.parse(process.env.WEATHER_PROVIDER_CONFIG) : null;
    
    // Get weather data using the configured providers with fallback
    const weatherData = await getWeatherWithFallback(latitude, longitude, weatherProviderFlag);
    
    // Cache the response
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    console.log(`Cached weather data for ${cacheKey} from provider: ${weatherData.provider}`);
    
    res.json(weatherData);
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch weather data'
    });
  }
});

// Weather testing endpoint (for debugging individual providers)
app.get('/api/weather/test', rateLimit, async (req, res) => {
  try {
    const { provider, lat, lon } = req.query;
    
    // Validate parameters
    if (!provider) {
      return res.status(400).json({
        error: 'Missing provider parameter',
        message: 'Please specify a weather provider to test'
      });
    }
    
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Please provide lat and lon parameters'
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }
    
    // Check if provider exists
    const allProviders = Object.keys(weatherProviders.providers);
    if (!allProviders.includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: `Provider '${provider}' not found. Available providers: ${allProviders.join(', ')}`
      });
    }
    
    // Test the specific provider
    console.log(`Testing weather provider: ${provider} for coordinates ${latitude}, ${longitude}`);
    
    try {
      const weatherData = await weatherProviders.getWeather(provider, latitude, longitude);
      console.log(`Successfully tested provider: ${provider}`);
      
      res.json({
        ...weatherData,
        testProvider: provider,
        testCoordinates: { lat: latitude, lon: longitude },
        testTimestamp: new Date().toISOString()
      });
      
    } catch (providerError) {
      console.error(`Provider ${provider} test failed:`, providerError.message);
      
      return res.status(500).json({
        error: 'Provider test failed',
        message: providerError.message,
        provider: provider,
        testCoordinates: { lat: latitude, lon: longitude },
        testTimestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Weather test API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test weather provider'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.2.0'
  });
});

// API status endpoint (for debugging - doesn't expose the keys)
app.get('/api/status', (req, res) => {
  // Get available weather providers
  const availableProviders = weatherProviders.getAvailableProviders();
  const allProviders = Object.keys(weatherProviders.providers);
  
  // Get provider status
  const providerStatus = {};
  allProviders.forEach(provider => {
    const isAvailable = weatherProviders.isProviderAvailable(provider);
    providerStatus[provider] = {
      available: isAvailable,
      requiresApiKey: weatherProviders.providers[provider].requiresApiKey,
      status: isAvailable ? 'Ready' : (weatherProviders.providers[provider].requiresApiKey ? 'Missing API Key' : 'Error')
    };
  });
  
  // Get current weather provider configuration
  const weatherProviderFlag = process.env.WEATHER_PROVIDER_CONFIG ? 
    JSON.parse(process.env.WEATHER_PROVIDER_CONFIG) : null;
  const currentConfig = getWeatherProviderConfig(weatherProviderFlag);
  
  // Get cache statistics
  const cacheStats = {
    totalEntries: weatherCache.size,
    validEntries: 0,
    expiredEntries: 0,
    entries: []
  };
  
  weatherCache.forEach((entry, key) => {
    const isValid = isCacheValid(entry);
    const ageInSeconds = Math.round((Date.now() - entry.timestamp) / 1000);
    
    if (isValid) {
      cacheStats.validEntries++;
    } else {
      cacheStats.expiredEntries++;
    }
    
    cacheStats.entries.push({
      location: key,
      ageInSeconds,
      isValid,
      city: entry.data.location,
      provider: entry.data.provider || 'unknown'
    });
  });
  
  res.json({
    weatherProviders: {
      available: availableProviders,
      all: allProviders,
      status: providerStatus,
      currentConfig: currentConfig,
      configSource: process.env.WEATHER_PROVIDER_CONFIG ? 'Environment Variable' : 'Default'
    },
    rateLimit: {
      window: RATE_LIMIT_WINDOW,
      maxRequests: RATE_LIMIT_MAX_REQUESTS
    },
    cache: {
      duration: CACHE_DURATION,
      durationReadable: '1 hour',
      stats: cacheStats
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cached weather data endpoint (for debugging)
app.get('/api/weather/cache', (req, res) => {
  const cachedEntries = [];
  const now = Date.now();
  
  // Convert cache Map to array with additional metadata
  weatherCache.forEach((entry, key) => {
    const isValid = isCacheValid(entry);
    const ageInSeconds = Math.round((now - entry.timestamp) / 1000);
    const ageInMinutes = Math.round(ageInSeconds / 60);
    
    cachedEntries.push({
      coordinates: key,
      city: entry.data.location,
      temperature: entry.data.temperature,
      description: entry.data.description,
      humidity: entry.data.humidity,
      windSpeed: entry.data.windSpeed,
      icon: entry.data.icon,
      isMockData: entry.data.mockData || false,
      cached: {
        timestamp: entry.timestamp,
        timestampReadable: new Date(entry.timestamp).toISOString(),
        ageInSeconds,
        ageInMinutes,
        isValid,
        expiresIn: isValid ? Math.round((CACHE_DURATION - (now - entry.timestamp)) / 1000) : 0
      }
    });
  });
  
  // Sort by timestamp (newest first)
  cachedEntries.sort((a, b) => b.cached.timestamp - a.cached.timestamp);
  
  res.json({
    cacheInfo: {
      totalEntries: weatherCache.size,
      validEntries: cachedEntries.filter(e => e.cached.isValid).length,
      expiredEntries: cachedEntries.filter(e => !e.cached.isValid).length,
      cacheDuration: CACHE_DURATION,
      cacheDurationReadable: '1 hour',
      lastCleanup: 'Every 30 minutes'
    },
    entries: cachedEntries,
    retrievedAt: new Date().toISOString()
  });
});

// Serve static files from React build
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// Serve React app for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌊 Weather Synth server running on port ${PORT}`);
  console.log(`🔑 API Key status: ${process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Missing (Mock mode)'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📂 Serving static files from: ${buildPath}`);
  console.log(`⚡ Weather data caching enabled (1 hour duration)`);
  console.log(`🧹 Cache cleanup runs every 30 minutes`);
});

module.exports = app; 