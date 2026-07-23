import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, Search, Cpu,
  Activity, List, LogOut, ChevronRight, Menu, X,
  Shield, Wifi, BarChart3, Inbox
} from 'lucide-react';
import clsx from 'clsx';

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
      { icon: Building2,      label: 'Organizations', path: '/super-admin/organizations' },
      { icon: Users,          label: 'All Users',     path: '/super-admin/users' },
      { icon: Search,         label: 'Query Explorer',path: '/super-admin/queries' },
      { icon: Inbox,          label: 'Waitlist',      path: '/super-admin/waitlist' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { icon: Wifi,           label: 'Gateway Monitor', path: '/super-admin/gateway' },
      { icon: Cpu,            label: 'LLM Usage',       path: '/super-admin/llm' },
      { icon: Activity,       label: 'System Health',   path: '/super-admin/health' },
    ],
  },
];

export default function SuperAdminLayout({ user, onSignOut }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase()
    || user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/70 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="h-full flex-shrink-0 overflow-hidden border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl z-50 fixed md:relative"
      >
        <div className="flex flex-col h-full min-w-[256px] p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 mt-1 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">Super Admin</p>
              <p className="text-[10px] text-slate-400">Repnex Platform</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1 text-slate-500 hover:text-slate-300 transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
            {NAV_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
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
                          'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm relative',
                          isActive
                            ? 'bg-violet-600/20 text-violet-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sa-active-pill"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-r-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300')} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom: back to app + user */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Back to App
            </button>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
                  <p className="text-[10px] text-violet-400">super_admin</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-4 flex items-center gap-3 flex-shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600/20 flex items-center justify-center">
              <Shield className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-slate-200">Repnex Super Admin</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-600/30 font-medium">
              Platform Control
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  );
}
