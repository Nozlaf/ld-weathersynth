import ReactGA from 'react-ga4';

// Get Google Analytics Measurement ID from environment variable or use default
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export const initializeGA = (): void => {
  if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Google Analytics initialized');
  } else {
    console.warn('Google Analytics not initialized: Please replace GA_MEASUREMENT_ID with your actual measurement ID');
  }
};

export const trackPageView = (path: string): void => {
  if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>): void => {
  if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event(eventName, parameters);
  }
};

export const trackCustomEvent = (action: string, category: string, label?: string, value?: number): void => {
  if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.event({
      action,
      category,
      label,
      value,
    });
  }
}; 