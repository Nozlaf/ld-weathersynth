import { getCurrentWeather, WeatherAPIError } from '../weatherService';
import { createMockLDClient } from '../../utils/testUtils';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

const mockWeatherResponse = {
  main: {
    temp: 22,
    humidity: 65,
  },
  weather: [
    {
      main: 'Clear',
      description: 'clear sky',
      icon: '01d',
    },
  ],
  name: 'New York',
  sys: {
    country: 'US',
  },
  wind: {
    speed: 12,
  },
};

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        timestamp: Date.now(),
      });
    });
  });

  describe('getCurrentWeather', () => {
    it('fetches weather data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      const ldClient = createMockLDClient();
      const result = await getCurrentWeather(ldClient as any);

      expect(result).toEqual({
        temperature: 22,
        description: 'clear sky',
        location: 'New York, US',
        humidity: 65,
        windSpeed: 12,
        icon: '01d',
      });
    });

    it('handles geolocation errors gracefully', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({
          code: 1,
          message: 'Permission denied',
        });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      const ldClient = createMockLDClient();
      const result = await getCurrentWeather(ldClient as any);

      // Should still work with fallback coordinates
      expect(result).toBeDefined();
      expect(result.temperature).toBe(22);
    });

    it('handles API errors properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          cod: 401,
          message: 'Invalid API key',
        }),
      } as Response);

      const ldClient = createMockLDClient();

      try {
        await getCurrentWeather(ldClient as any);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toMatchObject({
          code: 401,
          type: 'API_KEY_INVALID',
          message: expect.any(String),
        });
      }
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const ldClient = createMockLDClient();

      await expect(getCurrentWeather(ldClient as any)).rejects.toThrow('Network error');
    });

    it('handles malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      } as Response);

      const ldClient = createMockLDClient();

      await expect(getCurrentWeather(ldClient as any)).rejects.toThrow();
    });

    it('uses LaunchDarkly context for API calls', async () => {
      const mockClient = createMockLDClient();
      mockClient.getContext.mockReturnValue({
        key: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      await getCurrentWeather(mockClient as any);

      expect(mockClient.getContext).toHaveBeenCalled();
    });

    it('tracks latency metrics to LaunchDarkly', async () => {
      const mockClient = createMockLDClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      await getCurrentWeather(mockClient as any);

      expect(mockClient.track).toHaveBeenCalledWith(
        'upstream_latency',
        expect.objectContaining({
          latency_ms: expect.any(Number),
          success: true,
          provider: expect.any(String),
        })
      );
    });

    it('handles different weather conditions', async () => {
      const rainyWeatherResponse = {
        ...mockWeatherResponse,
        weather: [
          {
            main: 'Rain',
            description: 'moderate rain',
            icon: '10d',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rainyWeatherResponse,
      } as Response);

      const ldClient = createMockLDClient();
      const result = await getCurrentWeather(ldClient as any);

      expect(result.description).toBe('moderate rain');
      expect(result.icon).toBe('10d');
    });

    it('handles missing optional fields', async () => {
      const minimalWeatherResponse = {
        main: {
          temp: 20,
        },
        weather: [
          {
            main: 'Clear',
            description: 'clear sky',
            icon: '01d',
          },
        ],
        name: 'Test City',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => minimalWeatherResponse,
      } as Response);

      const ldClient = createMockLDClient();
      const result = await getCurrentWeather(ldClient as any);

      expect(result.temperature).toBe(20);
      expect(result.humidity).toBeUndefined();
      expect(result.windSpeed).toBeUndefined();
    });
  });

  describe('Error Structure', () => {
    it('API errors have proper structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          message: 'Server error',
        }),
      } as Response);

      const ldClient = createMockLDClient();

      try {
        await getCurrentWeather(ldClient as any);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toMatchObject({
          code: expect.any(Number),
          message: expect.any(String),
          type: expect.stringMatching(/API_KEY_INVALID|NETWORK_ERROR|UNKNOWN_ERROR/),
        });
      }
    });
  });
}); 