import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PanelLeftOpen, PanelLeftClose, Bell, Layers } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import { StatusPill } from '../components/ui/product-ui';

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
  const [headerConfig, setHeaderConfig] = useState({
    title: '',
    subtitle: '',
    icon: null,
    actions: null,
    hidden: false,
  });
  const location = useLocation();

  // Reset header config when changing route
  useEffect(() => {
    setHeaderConfig({
      title: '',
      subtitle: '',
      icon: null,
      actions: null,
      hidden: location.pathname.startsWith('/chat'),
    });
  }, [location.pathname]);
  
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

  const getLayoutTransitionKey = (pathname) => {
    if (pathname.startsWith('/chat')) {
      return '/chat';
    }
    return pathname;
  };

  return (
    <div className="workspace-canvas relative flex h-screen w-full overflow-hidden bg-background transition-colors duration-500">
      
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notif) => (
            <Motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`app-surface flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-xl ${
                notif.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' :
                notif.type === 'error' ? 'text-rose-700 dark:text-rose-300' :
                'text-primary'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">{notif.message}</span>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onSignOut={handleSignOut}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Dynamic Top bar */}
        {!headerConfig.hidden && (
          <header className="z-20 flex h-16 flex-shrink-0 items-center justify-between border-b border-border/70 bg-card/80 px-3 backdrop-blur-2xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all hover:border-border/70 hover:bg-card hover:text-foreground hover:shadow-sm"
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              {headerConfig.title ? (
                typeof headerConfig.title === 'string' ? (
                  <div className="flex min-w-0 items-center gap-2.5">
                    {headerConfig.icon && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/8 text-primary">
                        {headerConfig.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-foreground">{headerConfig.title}</h1>
                      {headerConfig.subtitle && (
                        <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{headerConfig.subtitle}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  headerConfig.title
                )
              ) : (
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/8">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="truncate text-sm font-semibold text-foreground">Repnex Workspace</span>
                  <StatusPill tone="success" className="hidden shrink-0 sm:inline-flex">
                    <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    AI Active
                  </StatusPill>
                </div>
              )}
            </div>

            {headerConfig.actions && (
              <div className="flex shrink-0 items-center gap-2">
                {headerConfig.actions}
              </div>
            )}
          </header>
        )}

        {/* Keep navigation available when a page hides the standard header. */}
        {headerConfig.hidden && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="app-card group absolute z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-card/95 text-foreground shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              left: 'max(0.75rem, env(safe-area-inset-left))',
              top: 'max(0.75rem, env(safe-area-inset-top))',
            }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        )}

        {/* Page content */}
        <main className="surface-grid custom-scrollbar relative flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
             <Motion.div 
                key={getLayoutTransitionKey(location.pathname)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="h-full"
             >
                <Outlet context={{ isSidebarOpen, setIsSidebarOpen, setHeaderConfig }} />
             </Motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
