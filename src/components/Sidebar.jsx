import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  Bookmark, 
  CheckSquare, 
  Settings, 
  UserCircle,
  PanelLeftClose,
  Plus,
  Database,
  History,
  ChevronRight,
  Trash2
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { mockChatHistory } from "../services/mockData";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "AI Chat", id: "chat", path: "/chat" },
  { icon: Database, label: "Connections", id: "connections", path: "/connections" },
  { icon: BarChart3, label: "Reports", id: "reports", path: "/report" },
  { icon: Bookmark, label: "Saved Views", id: "saved", path: "/saved" },
];

export default function Sidebar({
  isOpen,
  setIsOpen
}) {
  const [showHistory, setShowHistory] = useState(true);
  const [chatHistory] = useState(mockChatHistory);
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

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
        width: isOpen ? 300 : 0,
        x: isOpen ? 0 : -300,
        opacity: isOpen ? 1 : 0
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-background border-r border-border/50 flex flex-col justify-between overflow-hidden absolute md:relative z-[60] shrink-0"
    >
      <div className="p-5 flex flex-col h-full min-w-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center bg-white p-1 pb-1.5 border border-border group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-shadow">
              <img src="/270970406.jpeg" alt="Logo" className="w-full h-full object-contain filter hue-rotate-15 contrast-125" />
            </div>
            <div>
              <motion.h1 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors"
              >
                RepNet
              </motion.h1>
              <p className="text-[10px] text-muted-foreground">AI-Powered ERP Reports</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground rounded-lg transition-colors"
          >
            <PanelLeftClose className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={() => navigate('/chat', { state: { createNew: true } })}
          className="flex items-center justify-between gap-3 w-full p-3.5 mb-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground rounded-xl transition-all shadow-lg shadow-primary/30 font-medium"
        >
           <span className="flex items-center gap-2.5 text-sm">
             <div className="bg-white/20 p-1.5 rounded-lg">
               <Plus className="w-4 h-4" />
             </div>
             New Report Chat
           </span>
           <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">⌘N</span>
        </button>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath.includes(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
                  isActive ? "text-primary bg-primary/10" : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-navLine"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-primary rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={clsx("w-5 h-5 flex-shrink-0 relative z-10", isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={clsx("text-sm relative z-10", isActive ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
                {item.id === 'connections' && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-medium">
                    3
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Chat History */}
        <div className="mt-6 flex-1 overflow-hidden flex flex-col">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              Recent Chats
            </span>
            <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", showHistory && "rotate-90")} />
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar"
              >
                {chatHistory.map((chat, i) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{chat.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{chat.date}</span>
                      <button
                        type="button"
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-all"
                        aria-label={`Delete ${chat.title}`}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-rose-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4 space-y-1 border-t border-border/50">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all">
            <UserCircle className="w-5 h-5" strokeWidth={2} />
            <span className="font-medium text-sm">Profile</span>
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className={clsx(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all",
              currentPath.includes('/settings') ? "text-primary bg-primary/10" : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </div>
    </motion.aside>
    </>
  );
}
