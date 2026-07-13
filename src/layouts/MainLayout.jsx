import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { PanelLeftOpen, Sun, Moon, Bell, LogOut, MessageSquarePlus } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';

const THEME_STORAGE_KEY = 'repnex-theme';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
  } catch {
    // Ignore storage read failures and use safe fallback.
  }

  return false;
};

export default function MainLayout({ user, onSignOut }) {
  const { notifications } = useApp();
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isViewer = user?.role === 'viewer';

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  
  // Decide if right-side TopNav controls should be hidden (only when full screen report is active)
  const isReportView = location.pathname.startsWith('/report/') && location.pathname !== '/report';

  // Collapse sidebar on small screens or when viewing a report
  useEffect(() => {
    if ((location.pathname.startsWith('/report/') && location.pathname !== '/report') || window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle initial screen size and resizes with threshold check
  useEffect(() => {
    let prevWidth = window.innerWidth;
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth >= 768 && currentWidth < 768) {
        setIsSidebarOpen(false);
      } else if (prevWidth < 768 && currentWidth >= 768) {
        setIsSidebarOpen(true);
      }
      prevWidth = currentWidth;
    };
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage write failures; theme still applies for this session.
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };

  const handleNewChat = () => {
    navigate('/chat');
    window.dispatchEvent(new CustomEvent('repnex-new-chat'));
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-700 bg-[var(--background)] overflow-hidden relative`}>
      
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notif) => (
            <Motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border ${
                notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                notif.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">{notif.message}</span>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Left Side Sidebar Open Toggle */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-40 pointer-events-auto cursor-pointer transition-all">
         <AnimatePresence>
           {!isSidebarOpen && (
             <Motion.button 
               initial={{ opacity: 0, x: -20, scale: 0.8 }}
               animate={{ opacity: 1, x: 0, scale: 1 }}
               exit={{ opacity: 0, x: -20, scale: 0.8 }}
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors bg-card/80 backdrop-blur-md border border-border/50 shadow-sm"
             >
               <PanelLeftOpen className="w-5 h-5" />
             </Motion.button>
           )}
         </AnimatePresence>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onSignOut={handleSignOut}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main className="flex-1 flex flex-col relative w-full min-w-0 h-full overflow-hidden mix-blend-normal z-10 transition-all duration-300">
         <AnimatePresence mode="wait">
            <Motion.div 
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }} 
               className="flex-1 h-full flex flex-col"
            >
               <Outlet />
            </Motion.div>
         </AnimatePresence>
      </main>

    </div>
  );
}
