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

    console.log(`[ThemeContext] applyTheme called with setting: ${setting}`); // Log input

    if (setting === 'system') {
      try {
        applyDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        // *** ADDED LOGGING HERE ***
        console.log(`[ThemeContext] System check: prefers-color-scheme: dark? ${applyDarkMode}`);
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
    // *** ADDED LOGGING HERE ***
    console.log(`[ThemeContext] Toggled 'dark' class: ${applyDarkMode}. Effective theme: ${determinedTheme}`);

  }, []);


  useEffect(() => {
    console.log(`[ThemeContext] themeSetting changed to: ${themeSetting}. Applying theme and updating localStorage.`); // Log state change
    applyTheme(themeSetting);

    try {
      if (themeSetting === 'system') {
        localStorage.removeItem('theme');
        console.log("[ThemeContext] Set theme to 'system', removed 'theme' from localStorage.");
      } else {
        localStorage.setItem('theme', themeSetting);
        console.log(`[ThemeContext] Set theme to '${themeSetting}', updated localStorage.`);
      }
    } catch (e) {
      console.warn("[ThemeContext] Could not write theme to localStorage.");
    }
  }, [themeSetting, applyTheme]);

  // --- Modified system change listener useEffect ---
  useEffect(() => {
    if (themeSetting !== 'system') {
      console.log("[ThemeContext] Listener effect: Not in 'system' mode, skipping listener setup.");
      return;
    }

    console.log("[ThemeContext] Listener effect: In 'system' mode, setting up listener.");
    let mediaQuery;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (event) => { // Pass the event object
        // *** ADDED LOGGING HERE ***
        console.log(`[ThemeContext] System theme changed via listener. New match: ${event.matches}`);
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
        console.log("[ThemeContext] Listener effect cleanup: Removing listener.");
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
