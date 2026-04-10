import { useState, useEffect } from 'react';
import { PanelLeftOpen, Sun, Moon, Bell, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AIChatArea from './components/AIChatArea';
import ChatConversation from './components/ChatConversation';
import ReportBuilder from './components/ReportBuilder';
import RightPanel from './components/RightPanel';
import Dashboard from './components/Dashboard';
import DatabaseConnections from './components/DatabaseConnections';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import AuthPage from './components/AuthPage';
import { AppProvider, useApp } from './context/AppContext';
import { authApi } from './services/mockApi';

function AppContent({ user, onSignOut }) {
  const { notifications } = useApp();
  const [activeView, setActiveView] = useState("chat");
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [chatState, setChatState] = useState("landing"); // landing | conversation | report
  const [activeQuery, setActiveQuery] = useState(null);
  const [currentReportData, setCurrentReportData] = useState(null);
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSearch = (query) => {
    setActiveQuery(query);
    setChatState("conversation");
  };

  const handleOpenReport = (query, reportData = null) => {
    setActiveQuery(query);
    setCurrentReportData(reportData);
    setChatState("report");
    setIsRightPanelOpen(true);
  };

  const handleOpenReportFromDashboard = (report) => {
    setActiveView('chat');
    setActiveQuery(report.query || report.title);
    setCurrentReportData(report);
    setChatState("report");
    setIsRightPanelOpen(true);
  };

  const handleSignOut = () => {
    void onSignOut();
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
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-40 pointer-events-none">
        
         {/* Left Side */}
         <div className="flex items-center gap-2 pointer-events-auto cursor-pointer transition-all">
            <AnimatePresence>
              {!isSidebarOpen && (
                <Motion.button 
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-2.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors bg-card/80 backdrop-blur-md border border-border/50"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </Motion.button>
              )}
            </AnimatePresence>
         </div>
         
         {/* Right Side */}
         <div className="pointer-events-auto flex items-center gap-3">
            {/* New Chat Button */}
            {activeView === 'chat' && chatState !== 'landing' && (
              <Motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setChatState('landing'); setActiveQuery(null); }} 
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-md border border-border/50 rounded-xl transition-colors"
              >
                + New Chat
              </Motion.button>
            )}

            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-md border border-border/50 rounded-xl transition-colors flex items-center gap-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)} 
             className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors bg-card/80 backdrop-blur-md border border-border/50"
             title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </button>
            
            {/* User Avatar */}
            <div
              className="w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-all hover:scale-105 text-white shadow-lg shadow-primary/20"
              title={user?.name || 'Authenticated user'}
            >
              {userInitial}
            </div>
         </div>
      </div>

      <Sidebar 
        activeView={activeView} 
        setActiveView={(view) => {
          if (view === 'chat' && activeView === 'chat') {
            return;
          }
          setActiveView(view);
          if (view === 'chat') {
            setChatState(activeQuery ? 'conversation' : 'landing');
          }
        }} 
        onNewChat={() => {
          setActiveView('chat');
          setChatState('landing');
          setActiveQuery(null);
          setCurrentReportData(null);
        }}
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 flex flex-col relative w-full min-w-0 h-full overflow-hidden mix-blend-normal z-10 transition-all duration-300">
         <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <Motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex h-full">
                <Dashboard onOpenReport={handleOpenReportFromDashboard} />
              </Motion.div>
            )}

            {activeView === 'connections' && (
              <Motion.div key="connections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex h-full">
                <DatabaseConnections />
              </Motion.div>
            )}

            {activeView === 'chat' && chatState === 'landing' && (
              <Motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-y-auto">
                <AIChatArea onSearch={handleSearch} />
              </Motion.div>
            )}

            {activeView === 'chat' && chatState === 'conversation' && activeQuery && (
              <Motion.div key="conv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
                <ChatConversation initialQuery={activeQuery} onOpenReport={handleOpenReport} />
              </Motion.div>
            )}

            {activeView === 'chat' && chatState === 'report' && activeQuery && (
              <Motion.div key="report" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
                <ReportBuilder 
                  query={activeQuery} 
                  reportData={currentReportData}
                  onClose={() => setChatState('conversation')} 
                />
              </Motion.div>
            )}

            {activeView === 'reports' && (
              <Motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex h-full">
                <Dashboard onOpenReport={handleOpenReportFromDashboard} />
              </Motion.div>
            )}

            {activeView !== 'chat' && activeView !== 'dashboard' && activeView !== 'connections' && activeView !== 'reports' && (
              <Motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full items-center justify-center text-foreground font-semibold flex-col gap-2">
                 <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                   <span className="text-4xl">🚀</span>
                 </div>
                 <span className="text-xl capitalize">{activeView}</span>
                 <span className="text-sm text-muted-foreground font-normal">(Coming Soon)</span>
              </Motion.div>
            )}
         </AnimatePresence>
      </main>

      {/* Right Panel for Insights */}
      {activeView === 'chat' && chatState === 'report' && (
        <RightPanel isOpen={isRightPanelOpen} />
      )}

    </div>
  );
}

function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const session = await authApi.getSession();
        if (isMounted) {
          setSessionUser(session);
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setSessionUser(authenticatedUser);
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    setSessionUser(null);
  };

  if (isSessionLoading) {
    return (
      <div className="h-screen w-full bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  if (!sessionUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <AppProvider>
      <AppContent user={sessionUser} onSignOut={handleSignOut} />
    </AppProvider>
  );
}

export default App
