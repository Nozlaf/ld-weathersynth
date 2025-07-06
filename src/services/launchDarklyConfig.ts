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
export const createLDContext = (userId?: string): LDContext => {
  return {
    kind: 'user',
    key: userId || getPersistentUserId(),
    // Following Rule 3: Include build version and session attributes
    custom: {
      buildVersion: process.env.REACT_APP_VERSION || '1.0.0',
      sessionId: sessionStorage.getItem('sessionId') || Math.random().toString(36),
      environment: process.env.NODE_ENV || 'development',
    }
  };
};

// Note: Cleanup and client access is handled by withLDProvider in React apps
// Manual shutdown not needed when using React SDK's withLDProvider pattern 