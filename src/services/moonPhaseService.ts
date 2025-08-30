// Moon Phase Service
// Calculates moon phases and provides moon phase information

export interface MoonPhaseInfo {
  phase: string;
  icon: string;
  description: string;
  illumination: number; // 0-1, where 0 is new moon, 1 is full moon
  age: number; // Days since new moon
}

export class MoonPhaseService {
  private static instance: MoonPhaseService | null = null;

  private constructor() {}

  public static getInstance(): MoonPhaseService {
    if (!MoonPhaseService.instance) {
      MoonPhaseService.instance = new MoonPhaseService();
    }
    return MoonPhaseService.instance;
  }

  /**
   * Calculate moon phase for a given date
   * Based on astronomical algorithms for moon phase calculation
   */
  public getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
    // Julian Day Number calculation
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let jd = 367 * year - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) + 
              Math.floor((275 * month) / 9) + day + 1721013.5;
    
    // Time since new moon on January 6, 2000 (known new moon)
    const newMoon2000 = 2451550.1;
    const lunarMonth = 29.53058867; // Synodic month length in days
    
    // Calculate days since the known new moon
    const daysSinceNewMoon = (jd - newMoon2000) % lunarMonth;
    
    // Calculate moon age (days since new moon)
    const moonAge = daysSinceNewMoon;
    
    // Calculate illumination (0 = new moon, 1 = full moon)
    const illumination = Math.sin((moonAge / lunarMonth) * Math.PI);
    
    // Determine moon phase
    const phase = this.getPhaseFromAge(moonAge);
    const icon = this.getPhaseIcon(phase);
    const description = this.getPhaseDescription(phase);
    
    return {
      phase,
      icon,
      description,
      illumination: Math.abs(illumination),
      age: moonAge
    };
  }

  /**
   * Get moon phase name from moon age
   */
  private getPhaseFromAge(age: number): string {
    if (age < 1.5) return 'new';
    if (age < 6.5) return 'waxing-crescent';
    if (age < 13.5) return 'first-quarter';
    if (age < 20.5) return 'waxing-gibbous';
    if (age < 27.5) return 'full';
    if (age < 34.5) return 'waning-gibbous';
    if (age < 41.5) return 'last-quarter';
    return 'waning-crescent';
  }

  /**
   * Get moon phase icon
   */
  private getPhaseIcon(phase: string): string {
    const iconMap: { [key: string]: string } = {
      'new': '🌑',
      'waxing-crescent': '🌒',
      'first-quarter': '🌓',
      'waxing-gibbous': '🌔',
      'full': '🌕',
      'waning-gibbous': '🌖',
      'last-quarter': '🌗',
      'waning-crescent': '🌘'
    };
    return iconMap[phase] || '🌑';
  }

  /**
   * Get moon phase description
   */
  private getPhaseDescription(phase: string): string {
    const descriptionMap: { [key: string]: string } = {
      'new': 'New Moon',
      'waxing-crescent': 'Waxing Crescent',
      'first-quarter': 'First Quarter',
      'waxing-gibbous': 'Waxing Gibbous',
      'full': 'Full Moon',
      'waning-gibbous': 'Waning Gibbous',
      'last-quarter': 'Last Quarter',
      'waning-crescent': 'Waning Crescent'
    };
    return descriptionMap[phase] || 'New Moon';
  }

  /**
   * Get moon phase for current time
   */
  public getCurrentMoonPhase(): MoonPhaseInfo {
    return this.getMoonPhase(new Date());
  }

  /**
   * Get moon phase for a specific date
   */
  public getMoonPhaseForDate(date: Date): MoonPhaseInfo {
    return this.getMoonPhase(date);
  }

  /**
   * Get moon phase for tonight (useful for weather display)
   */
  public getTonightMoonPhase(): MoonPhaseInfo {
    const tonight = new Date();
    // Set to 9 PM for better visibility
    tonight.setHours(21, 0, 0, 0);
    return this.getMoonPhase(tonight);
  }
}

export default MoonPhaseService;

