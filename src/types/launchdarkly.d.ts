declare module 'launchdarkly-react-client-sdk' {
  import { ComponentType } from 'react';

  export interface LDContext {
    kind: string;
    key: string;
    name?: string;
    email?: string;
    custom?: Record<string, any>;
  }

  export interface LDConfig {
    clientSideID: string;
    context: LDContext;
    timeout?: number;
    options?: {
      bootstrap?: string;
      baseUrl?: string;
      streamUrl?: string;
      eventsUrl?: string;
      plugins?: any[];
    };
  }

  export function withLDProvider(config: LDConfig): <P extends object>(Component: ComponentType<P>) => ComponentType<P>;
  export function useLDClient(): any;
  export function useFlags(): Record<string, any>;
} 