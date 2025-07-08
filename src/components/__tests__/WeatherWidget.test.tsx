import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import WeatherWidget from '../WeatherWidget';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { createMockLDClient, mockWeatherData, mockGeolocationSuccess, mockFetchSuccess } from '../../utils/testUtils';

// Mock the LaunchDarkly SDK
jest.mock('launchdarkly-react-client-sdk');
const mockUseLDClient = useLDClient as jest.MockedFunction<typeof useLDClient>;

// Mock the weather service
jest.mock('../../services/weatherService', () => ({
  getCurrentWeather: jest.fn(),
  WeatherAPIError: class WeatherAPIError extends Error {
    constructor(public type: string, public message: string, public code: number, public provider: string) {
      super(message);
    }
  },
}));

// Mock the theme hook
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark-synth',
    setTheme: jest.fn(),
  }),
}));

// Mock other services
jest.mock('../../services/moonPhaseService', () => ({
  default: {
    getMoonPhaseEmojiForWeather: jest.fn().mockResolvedValue('🌙'),
  },
}));

jest.mock('../../services/locationSimulationService', () => ({
  default: {
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../services/weatherDebugService', () => ({
  default: {
    getInstance: jest.fn(() => ({
      updateRefreshInterval: jest.fn(),
    })),
  },
}));

const renderWeatherWidget = (ldClient = createMockLDClient()) => {
  mockUseLDClient.mockReturnValue(ldClient as any);
  
  return render(
    <ThemeProvider>
      <WeatherWidget />
    </ThemeProvider>
  );
};

describe('WeatherWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGeolocationSuccess();
    mockFetchSuccess(mockWeatherData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders the weather widget', () => {
      renderWeatherWidget();
      
      // The component should be in the document
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderWeatherWidget();
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays weather data after loading', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('Clear sky')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });
  });

  describe('LaunchDarkly Integration', () => {
    it('uses LaunchDarkly flags for configuration', async () => {
      const mockClient = createMockLDClient({
        'enable-animations': true,
        'show-extra-weather-info': true,
        'weather-refresh-interval': 5,
        'default-temperature': 'c',
        'default-distance': 'm',
        'show-moon-phase': true,
      });
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(mockClient.variation).toHaveBeenCalledWith('enable-animations', true);
        expect(mockClient.variation).toHaveBeenCalledWith('show-extra-weather-info', true);
        expect(mockClient.variation).toHaveBeenCalledWith('weather-refresh-interval', 5);
        expect(mockClient.variation).toHaveBeenCalledWith('default-temperature', 'c');
        expect(mockClient.variation).toHaveBeenCalledWith('default-distance', 'm');
        expect(mockClient.variation).toHaveBeenCalledWith('show-moon-phase', true);
      });
    });

    it('handles flag changes dynamically', async () => {
      const mockClient = createMockLDClient({
        'default-temperature': 'c',
      });
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
      
      // Simulate flag change
      const onCallback = mockClient.on.mock.calls.find(call => call[0] === 'change')?.[1];
      if (onCallback) {
        onCallback({
          'default-temperature': { current: 'f' },
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('72°F')).toBeInTheDocument();
      });
    });
  });

  describe('Temperature Unit Conversion', () => {
    it('displays temperature in Celsius by default', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('22°C')).toBeInTheDocument();
      });
    });

    it('displays temperature in Fahrenheit when flag is set', async () => {
      const mockClient = createMockLDClient({
        'default-temperature': 'f',
      });
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(screen.getByText('72°F')).toBeInTheDocument();
      });
    });

    it('displays temperature in Kelvin when flag is set', async () => {
      const mockClient = createMockLDClient({
        'default-temperature': 'k',
      });
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(screen.getByText('295.15 K')).toBeInTheDocument();
      });
    });
  });

  describe('Distance Unit Conversion', () => {
    it('displays wind speed in km/h by default', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('12 KM/H')).toBeInTheDocument();
      });
    });

    it('displays wind speed in mph when flag is set', async () => {
      const mockClient = createMockLDClient({
        'default-distance': 'i',
      });
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(screen.getByText('7 MPH')).toBeInTheDocument();
      });
    });
  });

  describe('Options Modal', () => {
    it('opens options modal when options button is clicked', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('Clear sky')).toBeInTheDocument();
      });
      
      const optionsButton = screen.getByText('[OPTIONS]');
      fireEvent.click(optionsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes options modal when close button is clicked', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('Clear sky')).toBeInTheDocument();
      });
      
      const optionsButton = screen.getByText('[OPTIONS]');
      fireEvent.click(optionsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when weather fetching fails', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockRejectedValue(new Error('Network error'));
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch weather data/i)).toBeInTheDocument();
      });
    });

    it('displays fallback demo data when API key is invalid', async () => {
      const { getCurrentWeather, WeatherAPIError } = require('../../services/weatherService');
      getCurrentWeather.mockRejectedValue(new WeatherAPIError('API_KEY_INVALID', 'Invalid API key', 401, 'openweathermap'));
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByText('Demo Weather')).toBeInTheDocument();
        expect(screen.getByText('Demo City, XX')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes weather data at specified intervals', async () => {
      jest.useFakeTimers();
      
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      const mockClient = createMockLDClient({
        'weather-refresh-interval': 1, // 1 minute
      });
      
      renderWeatherWidget(mockClient);
      
      await waitFor(() => {
        expect(getCurrentWeather).toHaveBeenCalledTimes(1);
      });
      
      // Fast forward 1 minute
      jest.advanceTimersByTime(60000);
      
      await waitFor(() => {
        expect(getCurrentWeather).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      const { getCurrentWeather } = require('../../services/weatherService');
      getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      renderWeatherWidget();
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByText('[OPTIONS]')).toBeInTheDocument();
      });
    });
  });
}); 