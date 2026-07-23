import { motion, AnimatePresence } from "framer-motion";
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bookmark,
  Settings,
  UserCircle,
  PanelLeftClose,
  Plus,
  Database,
  History,
  ChevronRight,
  Trash2,
  Loader2,
  Layers,
  Sun,
  Moon,
  LogOut,
  Shield
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sessionsApi } from "../services/api";
import { useApp } from "../context/AppContext";

const navSections = [
  {
    label: "PLATFORM MENU",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", path: "/dashboard" },
      { icon: MessageSquare, label: "AI Chat", id: "chat", path: "/chat" },
      { icon: Database, label: "Connections", id: "connections", path: "/connections" },
    ]
  },
  {
    label: "ANALYTICS",
    items: [
      { icon: BarChart3, label: "Reports", id: "reports", path: "/report" },
      { icon: Bookmark, label: "Saved Views", id: "saved", path: "/saved" },
    ]
  },
  {
    label: "PREFERENCES",
    items: [
      { icon: Settings, label: "Settings", id: "settings", path: "/settings" },
    ]
  }
];

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Sidebar({ isOpen, setIsOpen, onSignOut, darkMode, setDarkMode }) {
  const { user, activeConnectionObj } = useApp();
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const [showHistory, setShowHistory] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  const dbTypeIcons = {
    postgres: "🐘",
    supabase: "⚡",
    mssql: "🔷",
    mysql: "🐬",
    oracle: "🔴",
    cloudsql: "☁️",
    mongodb: "🍃",
    custom: "⚙️"
  };

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const data = await sessionsApi.list();
      // Normalize — backend returns array directly
      const list = Array.isArray(data) ? data : (data?.sessions || data?.items || []);
      setSessions(list.slice(0, 15));
    } catch (err) {
      console.error('[Sidebar] Sessions fetch failed:', err?.message || err);
      setSessionsError(err?.message || 'Failed to load chats');
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();

    // Listen for session creation events from ChatConversation
    const handleUpdate = () => fetchSessions();
    window.addEventListener('repnex-sessions-updated', handleUpdate);
    return () => window.removeEventListener('repnex-sessions-updated', handleUpdate);
  }, [fetchSessions]);

  // Refetch when sidebar opens (covers returning from other pages)
  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen, fetchSessions]);

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await sessionsApi.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={{ width: 280, x: 0 }}
        animate={{
          width: isOpen ? 256 : 0,
          x: isOpen ? 0 : -256,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="h-full flex-shrink-0 overflow-hidden border-r border-border bg-card/80 backdrop-blur-xl z-50 fixed md:relative"
      >
        <div className="flex flex-col h-full min-w-[256px] p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 mt-1 px-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm border border-border/40 shrink-0 flex items-center justify-center">
              <img src="/270970406.jpeg" alt="Repnex Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground tracking-tight">Repnex</p>
              <p className="text-[10px] text-muted-foreground font-medium">AI-Powered ERP Platform</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              title="Collapse sidebar drawer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Active Connection Info Card */}
          {activeConnectionObj && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/connections')}
              className="mb-5 p-3 bg-zinc-900/5 dark:bg-zinc-100/5 hover:bg-zinc-900/10 dark:hover:bg-zinc-100/10 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-base shrink-0 select-none">
                {dbTypeIcons[activeConnectionObj.type] || "🔌"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 justify-between">
                  <span className="text-xs font-bold text-foreground truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {activeConnectionObj.name}
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 uppercase shrink-0 tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {activeConnectionObj.database || 'No Database'} • {activeConnectionObj.tables || 0} tables
                </p>
              </div>
            </motion.div>
          )}

          {/* New Chat Button */}
          {!isViewer && (
            <button
              onClick={() => {
                navigate('/chat');
                window.dispatchEvent(new CustomEvent('repnex-new-chat'));
              }}
              className="flex items-center justify-between gap-3 w-full p-3 mb-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 rounded-xl transition-all shadow-md font-semibold"
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" />
                New Report Chat
              </span>
              <span className="text-[10px] bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded font-mono font-bold">⌘N</span>
            </button>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-5 overflow-y-auto custom-scrollbar">
            {navSections.map((section, si) => (
              <div key={si}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2 font-mono">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items
                    .filter((item) => {
                      if (item.id === 'connections' && !isAdmin) return false;
                      if (item.id === 'chat' && isViewer) return false;
                      return true;
                    })
                    .map((item) => {
                      const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.path);
                            if (item.id === 'chat') {
                              window.dispatchEvent(new CustomEvent('repnex-new-chat'));
                            }
                          }}
                          className={clsx(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm relative tracking-tight",
                            isActive
                              ? "bg-zinc-100 dark:bg-zinc-800/80 text-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-navLine"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-zinc-900 dark:bg-zinc-100 rounded-r-full"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <Icon className={clsx("w-4 h-4 flex-shrink-0 relative z-10", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                          <span className={clsx("relative z-10", isActive ? "font-semibold text-foreground" : "font-medium")}>
                            {item.label}
                          </span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-foreground relative z-10" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>

          {/* Recent Chats */}
          {!isViewer && (
            <div className="mt-5 flex-1 overflow-hidden flex flex-col">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Recent Chats
                  {sessions.length > 0 && (
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-foreground border border-zinc-200 dark:border-zinc-700 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                      {sessions.length}
                    </span>
                  )}
                </span>
                <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", showHistory && "rotate-90")} />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-y-auto flex-1 space-y-0.5 pr-1 custom-scrollbar"
                  >
                    <SmartSkeleton loading={loadingSessions}>
                      {loadingSessions ? (
                        <div className="space-y-1.5 py-1 px-1">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse">
                              <div className="w-3.5 h-3.5 bg-muted rounded shrink-0" />
                              <div className="h-3 bg-muted rounded w-2/3" />
                            </div>
                          ))}
                        </div>
                      ) : sessionsError ? (
                        <div className="px-3 py-4 text-center">
                          <p className="text-xs text-rose-400 mb-2">{sessionsError}</p>
                          <button
                            onClick={fetchSessions}
                            className="text-xs text-foreground font-semibold underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                          <MessageSquare className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No chats yet. Start a new report chat above.</p>
                        </div>
                      ) : (
                        sessions.map((session, i) => (
                          <motion.button
                            key={session.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => navigate(`/chat/${session.id}`)}
                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group text-left"
                          >
                            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-xs">{session.title || 'Untitled Chat'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-[10px] text-muted-foreground hidden group-hover:hidden">
                                {timeAgo(session.created_at)}
                              </span>
                              {!isViewer && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(e, session.id)}
                                  disabled={deletingId === session.id}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-all"
                                >
                                  {deletingId === session.id
                                    ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                    : <Trash2 className="w-3 h-3 text-muted-foreground hover:text-rose-500" />
                                  }
                                </button>
                              )}
                            </div>
                          </motion.button>
                        ))
                      )}
                    </SmartSkeleton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-auto pt-4 border-t border-border/50">
            {/* User profile row */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-border/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-xs font-bold text-white dark:text-zinc-900 shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name || user?.email || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium capitalize">{user?.role || 'member'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Super Admin Switcher */}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => navigate('/super-admin')}
                    className="p-1.5 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title="Go to Super Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                {/* Theme Toggle */}
                {setDarkMode && (
                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}
                {/* Logout */}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
