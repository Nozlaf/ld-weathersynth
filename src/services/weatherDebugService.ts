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
        : 'http://localhost:3001'; // Backend server in development
      
      const response = await fetch(`${API_BASE_URL}/api/status`);
      
      if (response.ok) {
        const status = await response.json();
        this.debugInfo.apiKey = {
          hasKey: status.apiKey.hasKey,
          status: status.apiKey.status
        };
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