import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [themeSetting, setThemeSetting] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    } catch (e) {
      console.warn("[ThemeContext] Could not read theme from localStorage.");
    }
    return 'system';
  });

  // --- Modified applyTheme function ---
  const applyTheme = useCallback((setting) => {
    let applyDarkMode;
    let determinedTheme = 'light'; // Default to light

    if (setting === 'system') {
      try {
        applyDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        determinedTheme = applyDarkMode ? 'dark' : 'light';
      } catch (e) {
        console.warn("[ThemeContext] Could not access matchMedia, defaulting to light.");
        applyDarkMode = false;
        determinedTheme = 'light';
      }
    } else {
      applyDarkMode = setting === 'dark';
      determinedTheme = applyDarkMode ? 'dark' : 'light';
    }

    document.documentElement.classList.toggle('dark', applyDarkMode);
  }, []);


  useEffect(() => {
    applyTheme(themeSetting);

    try {
      if (themeSetting === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', themeSetting);
      }
    } catch (e) {
      console.warn("[ThemeContext] Could not write theme to localStorage.");
    }
  }, [themeSetting, applyTheme]);

  // --- Modified system change listener useEffect ---
  useEffect(() => {
    if (themeSetting !== 'system') {
      return;
    }

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (event) => { // Pass the event object
        // Re-evaluate and apply based on the current system preference
        applyTheme('system');
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) { // Deprecated fallback
        mediaQuery.addListener(handleChange);
      }

      // Cleanup listener
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.removeListener) { // Deprecated fallback
          mediaQuery.removeListener(handleChange);
        }
      };

    } catch (e) {
      console.warn("[ThemeContext] Could not add listener for system theme changes.");
      return;
    }

  }, [themeSetting, applyTheme]);

  const value = {
    theme: themeSetting,
    setTheme: setThemeSetting,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
