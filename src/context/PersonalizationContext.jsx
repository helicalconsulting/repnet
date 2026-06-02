import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'repnex-personalization';
const CASUAL_GREETINGS = ['hi', 'hello', 'hey', 'yo', 'sup', 'heya', 'howdy', 'good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening'];

const defaults = {
  displayName: '',
  preferredName: '',
  greetingStyle: 'time-based',
  aiTone: 'friendly',
};

const PersonalizationContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) };
    }
  } catch {
    /* storage unavailable */
  }
  return { ...defaults };
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function PersonalizationProvider({ children, user }) {
  const [profile, setProfile] = useState(() => loadFromStorage());

  useEffect(() => {
    if (user) {
      setProfile(prev => {
        if (!prev.displayName && (user.name || user.email)) {
          const updated = { ...prev, displayName: user.name || '', preferredName: user.name || user.email || '' };
          saveToStorage(updated);
          return updated;
        }
        return prev;
      });
    }
  }, [user]);

  const updateProfile = useCallback((updates) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      saveToStorage(next);
      return next;
    });
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (profile.greetingStyle === 'casual') return 'Hey';
    if (profile.greetingStyle === 'formal') return 'Hello';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [profile.greetingStyle]);

  const getDisplayName = useCallback(() => {
    return profile.preferredName || profile.displayName || 'there';
  }, [profile.preferredName, profile.displayName]);

  const getCasualResponse = useCallback((input) => {
    const name = getDisplayName();
    const greeting = getGreeting();
    const lower = input.toLowerCase().trim();
    const isGreeting = CASUAL_GREETINGS.some(g => lower.startsWith(g));
    if (!isGreeting) return null;

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
