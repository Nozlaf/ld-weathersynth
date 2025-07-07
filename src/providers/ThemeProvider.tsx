import React, { useState, useEffect, ReactNode } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { ThemeContext, Theme } from '../hooks/useTheme';
import { trackEvent } from '../utils/analytics';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark-synth');
  const ldClient = useLDClient();

  // Map LaunchDarkly themes to our new theme system
  const mapLDTheme = (ldTheme: string): Theme => {
    switch (ldTheme) {
      case 'dark':
        return 'dark-synth';
      case 'light':
        return 'light';
      case 'dark-synth':
        return 'dark-synth';
      case 'dark-green':
        return 'dark-green';
      case 'dark-orange':
        return 'dark-orange';
      case 'grayscale':
        return 'grayscale';
      case 'dark-grayscale':
        return 'dark-grayscale';
      case 'sakura':
        return 'sakura';
      case 'winter':
        return 'winter';
      case 'heart-of-gold':
        return 'heart-of-gold';
      default:
        console.warn(`ThemeProvider - Unknown LaunchDarkly theme value: ${ldTheme}, falling back to dark-synth`);
        return 'dark-synth';
    }
  };

  // Helper function to track theme changes in both Google Analytics and LaunchDarkly
  const trackThemeChange = (previousTheme: Theme, newTheme: Theme, changeMethod: string, flagValue?: string) => {
    const eventData = {
      previous_theme: previousTheme,
      new_theme: newTheme,
      change_method: changeMethod,
      ...(flagValue && { flag_value: flagValue })
    };

    // Track in Google Analytics
    trackEvent('theme-change', eventData);

    // Track in LaunchDarkly
    if (ldClient && typeof ldClient.track === 'function') {
      try {
        ldClient.track('theme-change', eventData);
      } catch (error) {
        console.warn('Failed to track theme change in LaunchDarkly:', error);
      }
    }
  };

  useEffect(() => {
    // Check for user's manual theme preference first
    const savedTheme = localStorage.getItem('weather-app-theme') as Theme | null;
    
    if (!ldClient) {
      // LaunchDarkly not available, use saved theme or default dark-synth theme
      setTheme(savedTheme || 'dark-synth');
      return;
    }

    // LaunchDarkly client is available
    const flagTheme = ldClient.variation('default-theme', 'dark');

    // Use saved theme if available, otherwise use mapped LaunchDarkly flag
    const finalTheme = savedTheme || mapLDTheme(flagTheme);

    // Validate final theme value
    const validThemes: Theme[] = ['dark-synth', 'dark-green', 'dark-orange', 'light', 'grayscale', 'dark-grayscale', 'sakura', 'winter', 'heart-of-gold'];
    if (validThemes.includes(finalTheme)) {
      setTheme(finalTheme);
    } else {
      console.warn('ThemeProvider - Invalid theme value, falling back to dark-synth. Theme was:', finalTheme);
      setTheme('dark-synth');
    }

    // Listen for flag changes (only apply if no manual override)
    const flagChangeHandler = (changes: any) => {
      if (changes['default-theme'] && !localStorage.getItem('weather-app-theme')) {
        const newFlagTheme = changes['default-theme'].current;
        const mappedTheme = mapLDTheme(newFlagTheme);
        const previousTheme = theme;
        
        setTheme(mappedTheme);
        
        // Track theme change event
        trackThemeChange(previousTheme, mappedTheme, 'launchdarkly_flag', newFlagTheme);
      }
    };

    ldClient.on('change', flagChangeHandler);

    return () => {
      ldClient.off('change', flagChangeHandler);
    };
  }, [ldClient]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = (() => {
        switch (prev) {
          case 'dark-synth':
            return 'dark-green';
          case 'dark-green':
            return 'dark-orange';
          case 'dark-orange':
            return 'light';
          case 'light':
            return 'grayscale';
          case 'grayscale':
            return 'dark-grayscale';
          case 'dark-grayscale':
            return 'sakura';
          case 'sakura':
            return 'winter';
          case 'winter':
            return 'heart-of-gold';
          case 'heart-of-gold':
            return 'dark-synth';
          default:
            return 'dark-synth';
        }
      })();
      
      // Track theme change event
      trackThemeChange(prev, newTheme, 'toggle');
      
      return newTheme;
    });
  };

  const setThemeManually = (newTheme: Theme) => {
    localStorage.setItem('weather-app-theme', newTheme);
    setTheme(newTheme);
  };

  const resetThemeToDefault = () => {
    localStorage.removeItem('weather-app-theme');
    
    let newTheme: Theme;
    if (ldClient) {
      const flagTheme = ldClient.variation('default-theme', 'dark');
      newTheme = mapLDTheme(flagTheme);
      setTheme(newTheme);
    } else {
      newTheme = 'dark-synth';
      setTheme(newTheme);
    }
  };

  // Function to track theme changes - called externally when options modal closes
  const trackThemeChangeOnClose = (previousTheme: Theme, newTheme: Theme, changeMethod: string) => {
    if (previousTheme !== newTheme) {
      trackThemeChange(previousTheme, newTheme, changeMethod);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeManually, resetThemeToDefault, trackThemeChangeOnClose }}>
      {children}
    </ThemeContext.Provider>
  );
}; 