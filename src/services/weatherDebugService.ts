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
        hasKey: !!process.env.REACT_APP_OPENWEATHER_API_KEY,
        status: process.env.REACT_APP_OPENWEATHER_API_KEY ? 'Present' : 'Missing (Using Mock Data)'
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
        provider: 'OpenWeatherMap'
      }
    };
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
}

export default WeatherDebugService; 