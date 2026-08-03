import { flushSync } from 'react-dom';

const THEME_STORAGE_KEY = 'repnex-theme';
const FALLBACK_DURATION_MS = 280;
const VIEW_TRANSITION_DURATION_MS = 360;
const DESKTOP_TRANSITION_DURATION_MS = 320;
const THEME_PULSE_DURATION_MS = 280;
const REVEAL_START_RADIUS_PX = 8;
const DESKTOP_MEDIA_QUERY = '(min-width: 1280px)';

let activeThemeTransition = null;
let activeThemePulse = null;
let fallbackCleanupTimer = null;

const persistTheme = (isDark) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    // The theme can still change when browser storage is unavailable.
  }
};

const applyTheme = (isDark, setDarkMode) => {
  document.documentElement.classList.toggle('dark', isDark);
  persistTheme(isDark);

  flushSync(() => {
    setDarkMode(isDark);
  });
};

const getTransitionOrigin = (event) => {
  const trigger = event?.currentTarget;

  if (trigger instanceof Element) {
    const bounds = trigger.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
};

const playThemeColorPulse = ({ x, y }) => {
  activeThemePulse?.remove();

  const pulse = document.createElement('div');
  pulse.className = 'theme-toggle-color-pulse';
  pulse.setAttribute('popover', 'manual');
  pulse.setAttribute('aria-hidden', 'true');
  pulse.style.setProperty('--theme-pulse-x', `${x}px`);
  pulse.style.setProperty('--theme-pulse-y', `${y}px`);
  document.body.append(pulse);

  if (typeof pulse.showPopover !== 'function') {
    pulse.remove();
    return;
  }

  try {
    pulse.showPopover();
    activeThemePulse = pulse;

    const animation = pulse.animate(
      [
        {
          opacity: 0.5,
          transform: 'translate3d(-50%, -50%, 0) scale(0.72)',
        },
        {
          opacity: 0,
          transform: 'translate3d(-50%, -50%, 0) scale(1.75)',
        },
      ],
      {
        duration: THEME_PULSE_DURATION_MS,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'forwards',
      },
    );

    animation.finished
      .catch(() => {})
      .finally(() => {
        pulse.remove();
        if (activeThemePulse === pulse) {
          activeThemePulse = null;
        }
      });
  } catch {
    pulse.remove();
  }
};

const applyFallbackTransition = (isDark, setDarkMode) => {
  const root = document.documentElement;

  window.clearTimeout(fallbackCleanupTimer);
  root.classList.add('theme-transition-fallback');

  // Ensure transition rules are active before theme variables change.
  void root.offsetWidth;
  applyTheme(isDark, setDarkMode);

  fallbackCleanupTimer = window.setTimeout(() => {
    root.classList.remove('theme-transition-fallback');
  }, FALLBACK_DURATION_MS);
};

export const toggleThemeWithTransition = ({
  darkMode,
  setDarkMode,
  event,
}) => {
  const nextDarkMode = !darkMode;
  const prefersReducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    applyTheme(nextDarkMode, setDarkMode);
    return;
  }

  if (typeof document.startViewTransition !== 'function') {
    applyFallbackTransition(nextDarkMode, setDarkMode);
    return;
  }

  activeThemeTransition?.skipTransition?.();

  const root = document.documentElement;
  const { x, y } = getTransitionOrigin(event);
  const useLightweightDesktopTransition = window.matchMedia?.(
    DESKTOP_MEDIA_QUERY,
  ).matches;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.classList.add('theme-view-transition');

  try {
    const transition = document.startViewTransition(() => {
      applyTheme(nextDarkMode, setDarkMode);
    });

    activeThemeTransition = transition;

    transition.ready
      .then(() => {
        if (useLightweightDesktopTransition) {
          playThemeColorPulse({ x, y });
        }

        const keyframes = useLightweightDesktopTransition
          ? {
              opacity: [0, 1],
              transform: ['scale(0.992)', 'scale(1)'],
              transformOrigin: [
                `${x}px ${y}px`,
                `${x}px ${y}px`,
              ],
            }
          : {
              clipPath: [
                `circle(${REVEAL_START_RADIUS_PX}px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            };

        root.animate(
          keyframes,
          {
            duration: useLightweightDesktopTransition
              ? DESKTOP_TRANSITION_DURATION_MS
              : VIEW_TRANSITION_DURATION_MS,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        // The theme has already changed; animation failure needs no recovery.
      });

    transition.finished.finally(() => {
      if (activeThemeTransition === transition) {
        activeThemeTransition = null;
        root.classList.remove('theme-view-transition');
      }
    });
  } catch {
    root.classList.remove('theme-view-transition');
    applyFallbackTransition(nextDarkMode, setDarkMode);
  }
};
