export interface WeatherDebugInfo {
  apiKey: {
    hasKey: boolean;
    status: string;
  };
  location: {
    method: string;
    coordinates?: { lat: number; lon: number };
    address?: string;
    fallbackUsed: boolean;
  };
  lastRequest: {
    timestamp?: Date;
    url?: string;
    status?: string;
    responseTime?: number;
  };
  settings: {
    updateInterval: number;
    timeout: number;
    units: string;
    provider: string;
  };
  weatherProviders?: {
    available: string[];
    all: string[];
    status: Record<string, {
      available: boolean;
      requiresApiKey: boolean;
      status: string;
    }>;
    currentConfig: {
      primary: string;
      fallback: string;
    };
    configSource: string;
  };
}

class WeatherDebugService {
  private static instance: WeatherDebugService;
  private debugInfo: WeatherDebugInfo;

  private constructor() {
    this.debugInfo = {
      apiKey: {
        hasKey: false, // Will be updated by backend status check
        status: 'Checking...'
      },
      location: {
        method: 'Unknown',
        fallbackUsed: false
      },
      lastRequest: {},
      settings: {
        updateInterval: 5, // 5 minutes (now in minutes instead of milliseconds)
        timeout: 10000,
        units: 'metric',
        provider: 'Backend API Proxy'
      }
    };
    
    // Check API status from backend
    this.checkApiStatus();
  }

  public static getInstance(): WeatherDebugService {
    if (!WeatherDebugService.instance) {
      WeatherDebugService.instance = new WeatherDebugService();
    }
    return WeatherDebugService.instance;
  }

  public updateLocationInfo(method: string, coordinates?: { lat: number; lon: number }, address?: string, fallbackUsed?: boolean) {
    this.debugInfo.location = {
      method,
      coordinates,
      address,
      fallbackUsed: fallbackUsed || false
    };
  }

  public updateRequestInfo(url: string, status: string, responseTime: number) {
    this.debugInfo.lastRequest = {
      timestamp: new Date(),
      url,
      status,
      responseTime
    };
  }

  public updateRefreshInterval(intervalMinutes: number) {
    this.debugInfo.settings.updateInterval = intervalMinutes;
  }

  public getDebugInfo(): WeatherDebugInfo {
    return { ...this.debugInfo };
  }

  public getLocationString(): string {
    const loc = this.debugInfo.location;
    if (loc.coordinates) {
      return `${loc.coordinates.lat.toFixed(4)}, ${loc.coordinates.lon.toFixed(4)}`;
    }
    return 'Unknown';
  }

  public getApiStatus(): string {
    return this.debugInfo.apiKey.hasKey ? 'Active' : 'Mock Mode';
  }

  public getLastRequestStatus(): string {
    const req = this.debugInfo.lastRequest;
    if (!req.timestamp) return 'No requests yet';
    
    const timeAgo = Date.now() - req.timestamp.getTime();
    const minutesAgo = Math.floor(timeAgo / 60000);
    
    return `${req.status} (${minutesAgo}m ago)`;
  }

  private async checkApiStatus(): Promise<void> {
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? '' // Same origin in production 
        : process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'; // Backend server in development
      
      const response = await fetch(`${API_BASE_URL}/api/status`);
      
      if (response.ok) {
        const status = await response.json();
        
        // Update legacy API key status (for backward compatibility)
        const hasAnyApiKey = status.weatherProviders?.available?.length > 0;
        this.debugInfo.apiKey = {
          hasKey: hasAnyApiKey,
          status: hasAnyApiKey ? 'Provider Available' : 'Using Free Providers Only'
        };
        
        // Update weather providers information
        if (status.weatherProviders) {
          this.debugInfo.weatherProviders = status.weatherProviders;
          this.debugInfo.settings.provider = `${status.weatherProviders.currentConfig.primary} → ${status.weatherProviders.currentConfig.fallback}`;
        } else {
          // Fallback for older server versions
          this.debugInfo.apiKey = {
            hasKey: status.apiKey?.hasKey || false,
            status: status.apiKey?.status || 'Unknown'
          };
        }
      } else {
        this.debugInfo.apiKey = {
          hasKey: false,
          status: 'Backend unavailable'
        };
      }
    } catch (error) {
      console.warn('Failed to check API status:', error);
      this.debugInfo.apiKey = {
        hasKey: false,
        status: 'Status check failed'
      };
    }
  }
}

export default WeatherDebugService; 