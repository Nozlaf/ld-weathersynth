import { LDContext } from 'launchdarkly-react-client-sdk';

export const getSDKKey = (): string => {
  const sdkKey = process.env.REACT_APP_LAUNCHDARKLY_CLIENT_ID;
  if (!sdkKey) {
    // This warning should always show regardless of debug mode since it's a configuration issue
    console.warn('LaunchDarkly SDK key not found. Using demo key.');
    return 'demo-key-placeholder';
  }
  return sdkKey;
};

export interface LocationContext {
  city: string;
  country: string;
  fullLocation: string;
}

// Generate a persistent random GUID for anonymous users
const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

// Get or create a persistent user ID
const getPersistentUserId = (): string => {
  const STORAGE_KEY = 'ld_user_id';
  
  try {
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = generateGuid();
      localStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
  } catch (error) {
    // Fallback if localStorage is not available - this warning should always show
    console.warn('localStorage not available, using session-based ID');
    let userId = sessionStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = generateGuid();
      sessionStorage.setItem(STORAGE_KEY, userId);
    }
    return userId;
  }
};

// Following Rule 2: Context creation utility
export const createLDContext = (userId?: string, locationContext?: LocationContext): LDContext => {
  const context: LDContext = {
    kind: 'user',
    key: userId || getPersistentUserId(),
    // Following Rule 3: Include build version and session attributes
    custom: {
      buildVersion: process.env.REACT_APP_VERSION || '1.0.0',
      sessionId: sessionStorage.getItem('sessionId') || Math.random().toString(36),
      environment: process.env.NODE_ENV || 'development',
    }
  };

  // Add location context if available
  if (locationContext) {
    context.custom = {
      ...context.custom,
      city: locationContext.city,
      country: locationContext.country,
      location: locationContext.fullLocation,
    };
  }

  return context;
};

// Parse location string from weather API (e.g., "New York, US" or "London, GB")
export const parseLocationString = (locationString: string): LocationContext => {
  const parts = locationString.split(', ');
  const city = parts[0] || 'Unknown';
  const country = parts[1] || 'Unknown';
  
  return {
    city: city.trim(),
    country: country.trim(),
    fullLocation: locationString.trim(),
  };
};

// Re-identify with LaunchDarkly when location is available
export const reIdentifyWithLocation = (ldClient: any, locationString: string): void => {
  try {
    const locationContext = parseLocationString(locationString);
    const currentUserId = getPersistentUserId();
    const newContext = createLDContext(currentUserId, locationContext);
    
    console.log('🔍 DEBUG: Re-identifying with LaunchDarkly with location context:', {
      city: locationContext.city,
      country: locationContext.country,
      fullLocation: locationContext.fullLocation
    });
    
    // Re-identify the user with the new context including location
    ldClient.identify(newContext).then(() => {
      console.log('🔍 DEBUG: LaunchDarkly re-identification with location successful');
    }).catch((error: any) => {
      console.error('🔍 DEBUG: LaunchDarkly re-identification failed:', error);
    });
  } catch (error) {
    console.error('🔍 DEBUG: Error in reIdentifyWithLocation:', error);
  }
};

// Note: Cleanup and client access is handled by withLDProvider in React apps
// Manual shutdown not needed when using React SDK's withLDProvider pattern 