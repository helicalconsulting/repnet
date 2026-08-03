import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, Search, Cpu,
  Activity, List, LogOut, ChevronRight, Menu, X,
  Wifi, BarChart3, Inbox, Sun, Moon, FileText, AlertOctagon, MessageSquare, Calculator, MessageCircle
} from 'lucide-react';
import clsx from 'clsx';
import { ProductMark, StatusPill } from '../components/ui/product-ui';
import { toggleThemeWithTransition } from '../utils/themeTransition';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Overview', path: '/super-admin' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: Building2,      label: 'Organizations',          path: '/super-admin/organizations' },
      { icon: Users,          label: 'All Users',              path: '/super-admin/users' },
      { icon: MessageSquare,  label: 'User Feedback',          path: '/super-admin/feedback' },
      { icon: Search,         label: 'Query Explorer',         path: '/super-admin/queries' },
      { icon: MessageCircle,  label: 'Conversational Queries', path: '/super-admin/conversational-queries' },
      { icon: Inbox,          label: 'Waitlist',               path: '/super-admin/waitlist' },
    ],
  },
  {
    label: 'Infrastructure & Logs',
    items: [
      { icon: Wifi,           label: 'Gateway Monitor', path: '/super-admin/gateway' },
      { icon: Cpu,            label: 'LLM Usage',       path: '/super-admin/llm' },
      { icon: Calculator,     label: 'Token Estimator', path: '/super-admin/token-estimator' },
      { icon: Activity,       label: 'System Health',   path: '/super-admin/health' },
      { icon: FileText,       label: 'Audit Logs',      path: '/super-admin/audit-logs' },
      { icon: AlertOctagon,   label: 'Error Logs',      path: '/super-admin/error-logs' },
    ],
  },
];

export default function SuperAdminLayout({ user, onSignOut }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('repnex-theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('repnex-theme', darkMode ? 'dark' : 'light');
    } catch {
      // Theme still applies when browser storage is unavailable.
    }
  }, [darkMode]);

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase()
    || user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="super-admin-root workspace-canvas flex h-screen w-full overflow-hidden font-sans text-foreground transition-colors duration-300">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 272 : 0,
          x: sidebarOpen ? 0 : -272,
          opacity: sidebarOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className={clsx(
          "fixed z-50 h-full flex-shrink-0 overflow-hidden border-r border-border/70 bg-sidebar/95 shadow-xl backdrop-blur-xl md:relative md:shadow-none",
          !sidebarOpen && "border-none pointer-events-none"
        )}
      >
        <div className="flex h-full min-w-[272px] flex-col p-4">
          {/* Logo */}
          <div className="mb-7 mt-1 flex items-center gap-3 px-2">
            <ProductMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Repnex</p>
              <p className="text-[10px] font-medium text-muted-foreground">Platform administration</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
            {NAV_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.path === '/super-admin'
                      ? location.pathname === '/super-admin'
                      : location.pathname.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={clsx(
                          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                          isActive
                            ? 'bg-primary/10 font-semibold text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/75 hover:text-foreground'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sa-active-pill"
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className={clsx('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom: back to app + user */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              Back to App
            </button>
            <div className="app-card flex items-center justify-between rounded-xl px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate" title={user?.name || user?.full_name || user?.email}>
                    {user?.name || user?.full_name || user?.email || 'Super Admin'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate" title={user?.name || user?.full_name ? user?.email : 'super_admin'}>
                    {user?.name || user?.full_name ? user?.email : 'super_admin'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Theme Toggle */}
                <button
                  onClick={(event) => toggleThemeWithTransition({
                    darkMode,
                    setDarkMode,
                    event,
                  })}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                {/* Logout */}
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-border/65 bg-background/82 px-4 backdrop-blur-xl">
          {/* Always-visible sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <ProductMark className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-semibold text-foreground">Platform admin</span>
            <StatusPill tone="primary" className="hidden sm:inline-flex">Repnex</StatusPill>
          </div>
        </header>

        {/* Page content */}
        <main className="surface-grid custom-scrollbar flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.06); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); }
        .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  );
}
