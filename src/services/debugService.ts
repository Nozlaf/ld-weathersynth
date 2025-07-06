import { useLDClient } from 'launchdarkly-react-client-sdk';

class DebugService {
  private static instance: DebugService | null = null;
  private ldClient: any = null;
  private debugMode: boolean = false;

  private constructor() {}

  public static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService();
    }
    return DebugService.instance;
  }

  public setLDClient(client: any): void {
    this.ldClient = client;
    this.updateDebugMode();
    
    // Listen for flag changes
    if (client) {
      client.on('change:debug-mode', () => {
        this.updateDebugMode();
      });
    }
  }

  private updateDebugMode(): void {
    if (this.ldClient) {
      // Following LaunchDarkly Rule 1: Use variation with fallback
      this.debugMode = this.ldClient.variation('debug-mode', false);
    } else {
      // Fallback when LaunchDarkly is not available
      this.debugMode = false;
    }
  }

  public isDebugEnabled(): boolean {
    return this.debugMode;
  }

  // Debug logging methods
  public log(...args: any[]): void {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.debugMode) {
      console.warn(...args);
    }
  }

  public error(...args: any[]): void {
    if (this.debugMode) {
      console.error(...args);
    }
  }

  public info(...args: any[]): void {
    if (this.debugMode) {
      console.info(...args);
    }
  }

  // Special method for always showing errors (regardless of debug mode)
  public alwaysError(...args: any[]): void {
    console.error(...args);
  }

  // Special method for always showing warnings (regardless of debug mode)
  public alwaysWarn(...args: any[]): void {
    console.warn(...args);
  }
}

// Hook for React components to use debug service
export const useDebugService = () => {
  const ldClient = useLDClient();
  const debugService = DebugService.getInstance();
  
  // Update the LD client whenever it changes
  if (ldClient !== debugService['ldClient']) {
    debugService.setLDClient(ldClient);
  }
  
  return debugService;
};

export default DebugService; 