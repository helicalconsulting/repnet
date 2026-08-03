import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'repnex-personalization';
const CASUAL_GREETINGS = ['hi', 'hello', 'hey', 'yo', 'sup', 'heya', 'howdy', 'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening'];

const defaults = {
  displayName: '',
  preferredName: '',
  greetingStyle: 'time-based',
  aiTone: 'friendly',
};

/**
 * Extract a human-readable name from a user object.
 * Priority: user.name → user.full_name → smart parse of email username
 * e.g. "thesharmakeshav@gmail.com" → tries last segment → "Keshav"
 *      "john.doe@corp.com"         → "John"
 *      "jsmith@corp.com"           → "Jsmith" (fallback)
 */
function inferNameFromUser(user) {
  if (!user) return '';

  // Use explicit name fields first
  const explicit = user.name || user.full_name || user.display_name || '';
  if (explicit.trim()) return explicit.trim();

  // Parse from email
  const email = user.email || '';
  if (!email.includes('@')) return '';
  const localPart = email.split('@')[0]; // e.g. "thesharmakeshav"

  // If it contains a dot, take the first segment capitalized
  if (localPart.includes('.')) {
    return localPart.split('.')[0].replace(/^./, c => c.toUpperCase());
  }

  // Heuristic: try to extract the last "word" from a concatenated name
  // e.g. "thesharmakeshav" → check if it ends with a known pattern
  // Simple approach: take the last 4–8 chars as a first name guess
  // but only if the string is longer than 8 chars (likely concatenated)
  if (localPart.length > 8) {
    // Try to find a capital-case split point — fall back to last 6 chars
    const lastSix = localPart.slice(-6);
    return lastSix.replace(/^./, c => c.toUpperCase());
  }

  return localPart.replace(/^./, c => c.toUpperCase());
}

const PersonalizationContext = createContext(null);

function resolveUserTimeZone(user) {
  const profileTimeZone = user?.timezone || user?.time_zone;
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZone = profileTimeZone || browserTimeZone || 'UTC';

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return timeZone;
  } catch {
    return browserTimeZone || 'UTC';
  }
}

function getHourInTimeZone(date, timeZone) {
  try {
    const hourPart = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).find((part) => part.type === 'hour');
    const hour = Number(hourPart?.value);
    return Number.isFinite(hour) ? hour : date.getHours();
  } catch {
    return date.getHours();
  }
}

function getStorageKey(user) {
  const identity = user?.id || user?.email;
  return identity ? `${STORAGE_KEY}:${String(identity).toLowerCase()}` : `${STORAGE_KEY}:guest`;
}

function loadFromStorage(user) {
  try {
    const raw = localStorage.getItem(getStorageKey(user));
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    /* storage unavailable */
  }
  return { ...defaults };
}

function saveToStorage(data, user) {
  try {
    localStorage.setItem(getStorageKey(user), JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function PersonalizationProvider({ children, user }) {
  const [profile, setProfile] = useState(() => loadFromStorage(user));
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const timeZone = useMemo(() => resolveUserTimeZone(user), [user]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const storedProfile = loadFromStorage(user);
    if (!user) {
      setProfile(storedProfile);
      return;
    }

    if (!storedProfile.displayName && !storedProfile.preferredName) {
      const inferred = inferNameFromUser(user);
      if (inferred) {
        const updated = {
          ...storedProfile,
          displayName: user.name || user.full_name || inferred,
          preferredName: inferred,
        };
        saveToStorage(updated, user);
        setProfile(updated);
        return;
      }
    }

    setProfile(storedProfile);
  }, [user]);

  const updateProfile = useCallback((updates) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next, user);
      return next;
    });
  }, [user]);

  const getGreeting = useCallback((style = profile.greetingStyle) => {
    const hour = getHourInTimeZone(currentTime, timeZone);
    if (style === 'casual') return 'Hey';
    if (style === 'formal') return 'Hello';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [currentTime, profile.greetingStyle, timeZone]);

  const getDisplayName = useCallback(() => {
    return profile.preferredName || profile.displayName || 'there';
  }, [profile.preferredName, profile.displayName]);

  const getCasualResponse = useCallback((input) => {
    const name = getDisplayName();
    const greeting = getGreeting();
    const lower = input.toLowerCase().trim();
    
    // Clean punctuation for matching
    const cleanLower = lower.replace(/[-.,/#!$%^&*;:{}=_`~()?]/g, "").trim();
    const words = cleanLower.split(/\s+/);
    
    // If the message contains report/query keywords, do not treat it as a casual greeting
    const queryKeywords = ["show", "list", "report", "select", "customer", "invoice", "revenue", "sales", "inventory", "stock", "margin", "run", "find", "get", "view", "display", "overdue", "ageing", "top", "best"];
    const hasQueryKeywords = words.some(w => queryKeywords.includes(w));
    if (hasQueryKeywords) return null;

    // Check if it's a short message (max 3 words) starting with/matching a greeting
    const startsWithGreeting = CASUAL_GREETINGS.some(g => cleanLower === g || cleanLower.startsWith(g + ' '));
    if (!startsWithGreeting || words.length > 3) return null;

    const responses = profile.aiTone === 'professional'
      ? [`${greeting}, ${name}. How may I assist you with your ERP data analysis today?`]
      : profile.aiTone === 'concise'
        ? [`${greeting}, ${name}. What report do you need?`]
        : [`${greeting}, ${name}! How can I help you analyze your data today?`,
           `Hi there, ${name}! Ready to dive into your ERP reports?`,
           `Hey ${name}! What would you like to explore today?`];

    return responses[Math.floor(Math.random() * responses.length)];
  }, [getDisplayName, getGreeting, profile.aiTone]);

  const value = {
    profile,
    updateProfile,
    getGreeting,
    getDisplayName,
    getCasualResponse,
    timeZone,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }
  return ctx;
}
