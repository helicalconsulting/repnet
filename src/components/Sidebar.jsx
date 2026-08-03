import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bookmark,
  Settings,
  Database,
  History,
  ChevronRight,
  Trash2,
  Loader2,
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
import { ProductMark, StatusPill } from "./ui/product-ui";
import { toggleThemeWithTransition } from "../utils/themeTransition";

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
  const { user } = useApp();
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';
  const platform = typeof navigator !== "undefined"
    ? (navigator.userAgentData?.platform || navigator.platform || "")
    : "";
  const chatShortcutLabel = /Mac|iPhone|iPad|iPod/i.test(platform) ? "⌘ ⇧ K" : "Ctrl ⇧ K";

  useEffect(() => {
    if (isViewer) return undefined;

    const handleChatShortcut = (event) => {
      const usesPlatformModifier = event.metaKey || event.ctrlKey;
      if (!usesPlatformModifier || !event.shiftKey || event.altKey || event.key.toLowerCase() !== "k") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      navigate("/chat");
      window.dispatchEvent(new CustomEvent("repnex-new-chat"));
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleChatShortcut, true);
    return () => window.removeEventListener("keydown", handleChatShortcut, true);
  }, [isViewer, navigate, setIsOpen]);

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
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={{ width: 272, x: 0 }}
        animate={{
          width: isOpen ? 272 : 0,
          x: isOpen ? 0 : -272,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed z-50 h-full flex-shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur-2xl md:relative"
      >
        <div className="flex h-full min-w-[272px] flex-col p-4">
          {/* Header */}
          <div className="mb-6 mt-1 flex items-center gap-3 px-1">
            <ProductMark className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">Repnex</p>
                <StatusPill tone="primary" className="min-h-5 px-2 py-0 text-[9px]">AI</StatusPill>
              </div>
              <p className="truncate text-[11px] font-medium text-muted-foreground">ERP intelligence workspace</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto">
            {navSections.map((section, si) => (
              <div key={si}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
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
                            if (window.innerWidth < 768) {
                              setIsOpen(false);
                            }
                            if (item.id === 'chat') {
                              window.dispatchEvent(new CustomEvent('repnex-new-chat'));
                            }
                          }}
                          className={clsx(
                            "group relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm tracking-tight transition-all duration-200",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:bg-sidebar-accent/65 hover:text-sidebar-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-navLine"
                              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <Icon className={clsx("relative z-10 h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                          <span className={clsx("relative z-10", isActive ? "font-semibold text-sidebar-accent-foreground" : "font-medium")}>
                            {item.label}
                          </span>
                          <span className="relative z-10 ml-auto flex items-center gap-2">
                            {item.id === "chat" && (
                              <kbd className="hidden rounded-md border border-sidebar-border/80 bg-card/60 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-muted-foreground xl:inline">
                                {chatShortcutLabel}
                              </kbd>
                            )}
                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-sidebar-accent-foreground" />}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>

          {/* Recent Chats */}
          {!isViewer && (
            <div className="mt-4 flex max-h-64 flex-col overflow-hidden border-t border-sidebar-border/70 pt-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              >
                <span className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  Recent Chats
                  {sessions.length > 0 && (
                    <span className="rounded-full border border-primary/15 bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary">
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
                    className="custom-scrollbar relative flex-1 space-y-0.5 overflow-y-auto pr-1"
                  >
                    {loadingSessions ? (
                      <div className="space-y-1.5 px-1 py-1" aria-label="Loading recent chats">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex animate-pulse items-center gap-2 rounded-xl px-3 py-2.5">
                            <div className="h-3.5 w-3.5 shrink-0 rounded bg-muted" />
                            <div className="h-3 w-2/3 rounded bg-muted" />
                          </div>
                        ))}
                      </div>
                    ) : sessionsError ? (
                      <div className="px-3 py-4 text-center">
                        <p className="mb-2 text-xs text-rose-500">{sessionsError}</p>
                        <button onClick={fetchSessions} className="text-xs font-semibold text-primary hover:underline">
                          Retry
                        </button>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground/35" />
                        <p className="text-xs leading-5 text-muted-foreground">Your recent analyses will appear here.</p>
                      </div>
                    ) : (
                      sessions.map((session, i) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="group flex w-full items-center justify-between rounded-xl px-3 py-1 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-within:bg-sidebar-accent"
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/chat/${session.id}`)}
                            className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left outline-none"
                            aria-label={`Open ${session.title || 'Untitled Chat'}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs font-medium">{session.title || 'Untitled Chat'}</span>
                          </button>
                          <div className="ml-2 flex shrink-0 items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground group-hover:hidden">
                              {timeAgo(session.created_at)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, session.id)}
                              disabled={deletingId === session.id}
                              className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500 group-hover:flex"
                              aria-label={`Delete ${session.title || 'chat'}`}
                            >
                              {deletingId === session.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />
                              }
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-auto border-t border-sidebar-border/70 pt-4">
            {/* User profile row */}
            <div className="flex items-center justify-between rounded-2xl border border-sidebar-border/75 bg-card/55 px-3 py-2.5 shadow-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name || user?.email || 'User'}</p>
                  <p className="text-[10px] font-medium capitalize text-muted-foreground">{user?.role || 'member'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Super Admin Switcher */}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => navigate('/super-admin')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    title="Go to Super Admin Panel"
                    aria-label="Go to Super Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                {/* Theme Toggle */}
                {setDarkMode && (
                  <button
                    onClick={(event) => toggleThemeWithTransition({
                      darkMode,
                      setDarkMode,
                      event,
                    })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}
                {/* Logout */}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    title="Sign out"
                    aria-label="Sign out"
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
