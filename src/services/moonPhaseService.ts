import { MoonPhaseData, MoonPhaseResponse, MoonPhaseEmoji } from '../types/moonPhase';

// Moon phase emoji mapping based on illumination percentage and phase name
const MOON_PHASE_EMOJIS: MoonPhaseEmoji[] = [
  { emoji: '🌑', name: 'New Moon', illuminationRange: [0, 0.05] },
  { emoji: '🌒', name: 'Waxing Crescent', illuminationRange: [0.05, 0.25] },
  { emoji: '🌓', name: 'First Quarter', illuminationRange: [0.25, 0.45] },
  { emoji: '🌔', name: 'Waxing Gibbous', illuminationRange: [0.45, 0.95] },
  { emoji: '🌕', name: 'Full Moon', illuminationRange: [0.95, 1.0] },
  { emoji: '🌖', name: 'Waning Gibbous', illuminationRange: [0.55, 0.95] },
  { emoji: '🌗', name: 'Last Quarter', illuminationRange: [0.25, 0.55] },
  { emoji: '🌘', name: 'Waning Crescent', illuminationRange: [0.05, 0.25] },
];

class MoonPhaseService {
  private readonly API_BASE_URL = 'https://api.farmsense.net/v1/moonphases/';
  private cachedData: MoonPhaseResponse | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  /**
   * Get current moon phase data
   */
  async getCurrentMoonPhase(): Promise<MoonPhaseResponse> {
    // Check cache first
    if (this.cachedData && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetch(`${this.API_BASE_URL}?d=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Moon phase API error: ${response.status}`);
      }

      const data: MoonPhaseData[] = await response.json();
      
      if (!data || data.length === 0 || data[0].Error !== 0) {
        throw new Error('Invalid moon phase data received');
      }

      const moonData = data[0];
      const moonPhase = this.processMoonPhaseData(moonData);
      
      // Cache the result
      this.cachedData = moonPhase;
      this.cacheTimestamp = Date.now();
      
      return moonPhase;
    } catch (error) {
      console.warn('Failed to fetch moon phase data:', error);
      return this.getFallbackMoonPhase();
    }
  }

  /**
   * Process raw moon phase data into our standardized format
   */
  private processMoonPhaseData(data: MoonPhaseData): MoonPhaseResponse {
    const illumination = data.Illumination;
    const phase = data.Phase;
    const emoji = this.getMoonPhaseEmoji(illumination, phase);

    return {
      data,
      phase,
      illumination,
      emoji
    };
  }

  /**
   * Get appropriate moon phase emoji based on illumination and phase
   */
  private getMoonPhaseEmoji(illumination: number, phaseName: string): string {
    // Handle edge cases for specific phases
    if (phaseName.toLowerCase().includes('new')) {
      return '🌑';
    }
    
    if (phaseName.toLowerCase().includes('full')) {
      return '🌕';
    }

    // For waning phases, we need to determine if it's gibbous or crescent
    if (phaseName.toLowerCase().includes('waning')) {
      if (illumination > 0.5) {
        return '🌖'; // Waning Gibbous
      } else {
        return '🌘'; // Waning Crescent
      }
    }

    // For waxing phases
    if (phaseName.toLowerCase().includes('waxing')) {
      if (illumination > 0.5) {
        return '🌔'; // Waxing Gibbous
      } else {
        return '🌒'; // Waxing Crescent
      }
    }

    // Handle quarter phases
    if (phaseName.toLowerCase().includes('quarter')) {
      if (phaseName.toLowerCase().includes('first')) {
        return '🌓'; // First Quarter
      } else {
        return '🌗'; // Last Quarter
      }
    }

    // Fallback to illumination-based detection
    for (const phaseEmoji of MOON_PHASE_EMOJIS) {
      const [min, max] = phaseEmoji.illuminationRange;
      if (illumination >= min && illumination <= max) {
        return phaseEmoji.emoji;
      }
    }

    // Default fallback
    return '🌙';
  }

  /**
   * Get fallback moon phase when API fails
   */
  private getFallbackMoonPhase(): MoonPhaseResponse {
    return {
      data: {
        Error: 1,
        ErrorMsg: 'Fallback data',
        TargetDate: Date.now().toString(),
        Moon: ['Unknown'],
        Index: 0,
        Age: 0,
        Phase: 'Unknown',
        Distance: 0,
        Illumination: 0.5,
        AngularDiameter: 0,
        DistanceToSun: 0,
        SunAngularDiameter: 0
      },
      phase: 'Unknown',
      illumination: 0.5,
      emoji: '🌙'
    };
  }

  /**
   * Get moon phase emoji for nighttime weather display
   */
  getMoonPhaseEmojiForWeather(): Promise<string> {
    return this.getCurrentMoonPhase().then(data => data.emoji);
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cachedData = null;
    this.cacheTimestamp = 0;
  }
}

export const moonPhaseService = new MoonPhaseService();
export default moonPhaseService; 