import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { PanelLeftOpen, Sun, Moon, Bell, LogOut, MessageSquarePlus } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/mockApi';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ user, onSignOut }) {
  const { notifications } = useApp();
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  
  // Decide if TopNav should be faded out (e.g., when full screen report is active)
  const isReportView = location.pathname.includes('/report');

  // Collapse sidebar on small screens when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle initial screen size and resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    await authApi.signOut();
    if (onSignOut) onSignOut();
  };

  const handleNewChat = () => {
    navigate('/chat', { state: { createNew: true } });
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

      {/* Top Nav */}
      <div className={`absolute top-0 left-0 w-full p-4 md:p-6 justify-between items-center z-40 pointer-events-none transition-opacity duration-300 ${isReportView ? 'hidden' : 'flex'}`}>
        
         {/* Left Side */}
         <div className="flex items-center gap-2 pointer-events-auto cursor-pointer transition-all">
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
         
         {/* Right Side */}
         <div className="pointer-events-auto flex items-center gap-3">
            {!isReportView && location.pathname.includes('/chat') && (
              <Motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleNewChat} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-md border border-border/50 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </Motion.button>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)} 
             className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors bg-card/80 backdrop-blur-md border border-border/50 shadow-sm"
             title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </button>
           
           <button
             onClick={handleSignOut}
             className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-colors bg-card/80 backdrop-blur-md border border-border/50 shadow-sm"
             title="Sign out"
           >
             <LogOut className="w-4 h-4" />
           </button>
            
            {/* User Avatar */}
            <div
              className="w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-all hover:scale-105 text-white shadow-lg shadow-primary/20 ml-1"
              title={user?.name || 'Authenticated user'}
            >
              {userInitial}
            </div>
         </div>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
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
