import { createContext, useContext } from 'react';

export type Theme = 'dark-synth' | 'dark-green' | 'dark-orange' | 'light' | 'grayscale' | 'dark-grayscale' | 'sakura' | 'winter' | 'heart-of-gold';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeManually: (theme: Theme) => void;
  resetThemeToDefault: () => void;
  trackThemeChangeOnClose: (previousTheme: Theme, newTheme: Theme, changeMethod: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 