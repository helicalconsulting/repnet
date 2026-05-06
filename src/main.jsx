import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const THEME_STORAGE_KEY = 'repnex-theme';

if (typeof window !== 'undefined') {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const isDark = storedTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  } catch {
    document.documentElement.classList.remove('dark');
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
