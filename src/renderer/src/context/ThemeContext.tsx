import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeColors, lightTheme, darkTheme } from '../styles/theme';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('dajho_darkMode');
    return stored === 'true';
  });

  const colors = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem('dajho_darkMode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const setDarkMode = (value: boolean) => setIsDarkMode(value);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
