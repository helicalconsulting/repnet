/**
 * useTheme — reactive dark/light mode detection.
 *
 * Reads the `repnex-theme` localStorage key and monitors class changes on
 * <html> via MutationObserver so the value updates instantly when the user
 * toggles the theme in MainLayout.
 *
 * @returns {{ isDark: boolean }}
 */
import { useState, useEffect } from 'react';

const THEME_KEY = 'repnex-theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Initialise synchronously to avoid a flash on first render
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const check = () => {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === 'dark') return setIsDark(true);
      if (stored === 'light') return setIsDark(false);
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return { isDark };
}
