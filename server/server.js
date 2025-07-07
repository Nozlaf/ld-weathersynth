const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://clientstream.launchdarkly.com", "https://events.launchdarkly.com", "https://api.farmsense.net", "https://observability.app.launchdarkly.com", "https://pub.observability.app.launchdarkly.com"],
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
    
    // Get API key from server environment (not exposed to client)
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!OPENWEATHER_API_KEY) {
      // Return mock data if no API key is configured
      console.log('No API key configured, returning mock data');
      const mockData = {
        temperature: 22,
        description: 'Sunny',
        location: 'Demo City, XX',
        humidity: 65,
        windSpeed: 12,
        icon: '01d',
        mockData: true
      };
      
      // Cache mock data too
      weatherCache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      
      return res.json(mockData);
    }
    
    console.log(`Cache miss for ${cacheKey}, fetching from OpenWeatherMap API`);
    
    // Make request to OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status}`);
      
      if (response.status === 401) {
        return res.status(500).json({
          error: 'API configuration error',
          message: 'Weather service is temporarily unavailable'
        });
      }
      
      return res.status(502).json({
        error: 'External service error',
        message: 'Weather service is temporarily unavailable'
      });
    }
    
    const data = await response.json();
    
    // Transform data to match frontend expectations
    const weatherData = {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      icon: data.weather[0].icon,
      mockData: false
    };
    
    // Cache the successful response
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    console.log(`Cached weather data for ${cacheKey}`);
    
    res.json(weatherData);
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch weather data'
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

// API status endpoint (for debugging - doesn't expose the key)
app.get('/api/status', (req, res) => {
  const hasApiKey = !!process.env.OPENWEATHER_API_KEY;
  
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
      city: entry.data.location
    });
  });
  
  res.json({
    apiKey: {
      hasKey: hasApiKey,
      status: hasApiKey ? 'Configured' : 'Missing (Using Mock Data)'
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