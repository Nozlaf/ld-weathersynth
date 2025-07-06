export interface MoonPhaseData {
  Error: number;
  ErrorMsg: string;
  TargetDate: string;
  Moon: string[];
  Index: number;
  Age: number;
  Phase: string;
  Distance: number;
  Illumination: number;
  AngularDiameter: number;
  DistanceToSun: number;
  SunAngularDiameter: number;
}

export interface MoonPhaseResponse {
  data: MoonPhaseData;
  phase: string;
  illumination: number;
  emoji: string;
}

export type MoonPhaseType = 
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhaseEmoji {
  emoji: string;
  name: string;
  illuminationRange: [number, number];
}
