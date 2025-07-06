import { PresetLocation, LocationSimulationState, LocationOverride } from '../types/locationSimulation';

// Preset locations for simulation
const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'new-york',
    name: 'New York',
    displayName: 'New York, NY',
    coordinates: { lat: 40.7128, lon: -74.0060 },
    timezone: 'America/New_York',
    country: 'US',
    emoji: '🗽'
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    displayName: 'Los Angeles, CA',
    coordinates: { lat: 34.0522, lon: -118.2437 },
    timezone: 'America/Los_Angeles',
    country: 'US',
    emoji: '🌴'
  },
  {
    id: 'hawaii',
    name: 'Hawaii',
    displayName: 'Honolulu, HI',
    coordinates: { lat: 21.3099, lon: -157.8581 },
    timezone: 'Pacific/Honolulu',
    country: 'US',
    emoji: '🏝️'
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    displayName: 'Melbourne, Australia',
    coordinates: { lat: -37.8136, lon: 144.9631 },
    timezone: 'Australia/Melbourne',
    country: 'AU',
    emoji: '🇦🇺'
  },
  {
    id: 'perth',
    name: 'Perth',
    displayName: 'Perth, Australia',
    coordinates: { lat: -31.9505, lon: 115.8605 },
    timezone: 'Australia/Perth',
    country: 'AU',
    emoji: '🦘'
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    displayName: 'Bangalore, India',
    coordinates: { lat: 12.9716, lon: 77.5946 },
    timezone: 'Asia/Kolkata',
    country: 'IN',
    emoji: '🇮🇳'
  },
  {
    id: 'paris',
    name: 'Paris',
    displayName: 'Paris, France',
    coordinates: { lat: 48.8566, lon: 2.3522 },
    timezone: 'Europe/Paris',
    country: 'FR',
    emoji: '🗼'
  },
  {
    id: 'dubai',
    name: 'Dubai',
    displayName: 'Dubai, UAE',
    coordinates: { lat: 25.2048, lon: 55.2708 },
    timezone: 'Asia/Dubai',
    country: 'AE',
    emoji: '🏜️'
  },
  {
    id: 'malta',
    name: 'Malta',
    displayName: 'Valletta, Malta',
    coordinates: { lat: 35.8997, lon: 14.5147 },
    timezone: 'Europe/Malta',
    country: 'MT',
    emoji: '🇲🇹'
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    displayName: 'Amsterdam, Netherlands',
    coordinates: { lat: 52.3676, lon: 4.9041 },
    timezone: 'Europe/Amsterdam',
    country: 'NL',
    emoji: '🇳🇱'
  }
];

class LocationSimulationService {
  private state: LocationSimulationState;
  private subscribers: Array<(state: LocationSimulationState) => void> = [];
  private readonly STORAGE_KEY = 'weather-synth-location-simulation';

  constructor() {
    // Load persisted state from localStorage
    this.state = this.loadPersistedState();
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState(): LocationSimulationState {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Validate that the saved location still exists in preset locations
        if (parsed.isSimulating && parsed.activeLocation) {
          const locationExists = PRESET_LOCATIONS.find(loc => loc.id === parsed.activeLocation.id);
          if (locationExists) {
            return {
              isSimulating: parsed.isSimulating,
              activeLocation: locationExists,
              presetLocations: PRESET_LOCATIONS
            };
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted location simulation state:', error);
    }
    
    // Return default state if no valid persisted state found
    return {
      isSimulating: false,
      activeLocation: null,
      presetLocations: PRESET_LOCATIONS
    };
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      const stateToPersist = {
        isSimulating: this.state.isSimulating,
        activeLocation: this.state.activeLocation
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (error) {
      console.warn('Failed to persist location simulation state:', error);
    }
  }

  /**
   * Subscribe to location simulation state changes
   */
  subscribe(callback: (state: LocationSimulationState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    console.log(`🔍 DEBUG: notifySubscribers called, notifying ${this.subscribers.length} subscribers`);
    this.subscribers.forEach((callback, index) => {
      console.log(`🔍 DEBUG: Calling subscriber ${index + 1}`);
      callback(this.state);
    });
  }

  /**
   * Start simulating a location
   */
  startSimulation(locationId: string): void {
    console.log(`🔍 DEBUG: startSimulation called with locationId: ${locationId}`);
    const location = this.state.presetLocations.find(loc => loc.id === locationId);
    
    if (!location) {
      console.error(`Location with id "${locationId}" not found`);
      return;
    }

    this.state = {
      ...this.state,
      isSimulating: true,
      activeLocation: location
    };

    console.log(`🌍 Location simulation started: ${location.displayName}`);
    console.log(`🔍 DEBUG: Subscribers count: ${this.subscribers.length}`);
    this.persistState();
    this.notifySubscribers();
  }

  /**
   * Stop location simulation
   */
  stopSimulation(): void {
    const wasSimulating = this.state.isSimulating;
    console.log(`🔍 DEBUG: stopSimulation called, wasSimulating: ${wasSimulating}`);
    
    this.state = {
      ...this.state,
      isSimulating: false,
      activeLocation: null
    };

    if (wasSimulating) {
      console.log('🌍 Location simulation stopped');
      console.log(`🔍 DEBUG: Subscribers count: ${this.subscribers.length}`);
      this.persistState();
      this.notifySubscribers();
    }
  }

  /**
   * Get current simulation state
   */
  getState(): LocationSimulationState {
    return { ...this.state };
  }

  /**
   * Check if location simulation is active
   */
  isSimulating(): boolean {
    return this.state.isSimulating;
  }

  /**
   * Get the current simulated location
   */
  getActiveLocation(): PresetLocation | null {
    return this.state.activeLocation;
  }

  /**
   * Get all preset locations
   */
  getPresetLocations(): PresetLocation[] {
    return [...this.state.presetLocations];
  }

  /**
   * Get location override for weather service
   */
  getLocationOverride(): LocationOverride | null {
    const override = this.state.isSimulating && this.state.activeLocation ? {
      lat: this.state.activeLocation.coordinates.lat,
      lon: this.state.activeLocation.coordinates.lon,
      locationName: this.state.activeLocation.displayName
    } : null;
    
    console.log(`🔍 DEBUG: getLocationOverride called, returning:`, override);
    return override;
  }

  /**
   * Get location by ID
   */
  getLocationById(id: string): PresetLocation | null {
    return this.state.presetLocations.find(loc => loc.id === id) || null;
  }

  /**
   * Toggle simulation for a location
   */
  toggleSimulation(locationId: string): void {
    console.log(`🔍 DEBUG: toggleSimulation called with locationId: ${locationId}`);
    console.log(`🔍 DEBUG: Current state - isSimulating: ${this.state.isSimulating}, activeLocation: ${this.state.activeLocation?.id}`);
    
    if (this.state.isSimulating && this.state.activeLocation?.id === locationId) {
      this.stopSimulation();
    } else {
      this.startSimulation(locationId);
    }
  }

  /**
   * Clear all simulation data (for testing)
   */
  reset(): void {
    this.state = {
      isSimulating: false,
      activeLocation: null,
      presetLocations: PRESET_LOCATIONS
    };
    this.persistState();
    this.notifySubscribers();
  }
}

export const locationSimulationService = new LocationSimulationService();
export default locationSimulationService; 