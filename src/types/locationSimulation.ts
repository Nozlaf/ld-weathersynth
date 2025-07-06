export interface PresetLocation {
  id: string;
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  timezone: string;
  country: string;
  emoji: string;
}

export interface LocationSimulationState {
  isSimulating: boolean;
  activeLocation: PresetLocation | null;
  presetLocations: PresetLocation[];
}

export interface LocationOverride {
  lat: number;
  lon: number;
  locationName: string;
}

export type LocationSimulationAction = 
  | { type: 'START_SIMULATION'; location: PresetLocation }
  | { type: 'STOP_SIMULATION' }
  | { type: 'SET_PRESETS'; locations: PresetLocation[] }; 