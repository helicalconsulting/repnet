import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, RefreshCw, Sparkles, ChevronDown, Database, Zap, TrendingUp, Package, DollarSign, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { suggestions } from "../services/mockData";
import { useApp } from "../context/AppContext";

export default function AIChatArea({ onSearch }) {
  const { connections, activeConnection } = useApp();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [showConnectionBadge, setShowConnectionBadge] = useState(true);

  const activeConn = connections.find(c => c.id === activeConnection);

  const categoryIcons = {
    "Sales & Revenue": <DollarSign className="w-4 h-4" />,
    "Production & Quality": <Package className="w-4 h-4" />,
    "Inventory & Procurement": <TrendingUp className="w-4 h-4" />,
    "Finance & Analytics": <Zap className="w-4 h-4" />,
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.replace('\n', ' '));
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-16 pb-4 px-6 w-full max-w-4xl mx-auto min-h-full relative z-10">
      
      {/* Background glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Center Content */}
      <div className="w-full flex flex-col items-center relative z-20">
        
        {/* Glowy Orb */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-16 h-16 rounded-full mb-4 shadow-[0_0_60px_rgba(37,99,235,0.4)] bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] relative"
        >
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] blur-xl opacity-50"
          />
        </motion.div>

        {/* Headings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
            What report would you like to create?
          </h2>
          <p className="text-xs text-muted-foreground/70 w-72 mx-auto leading-relaxed">
            Ask me anything about your ERP data. I'll generate SQL queries and create visualizations.
          </p>
        </motion.div>

        {/* Connected Database Badge */}
        <AnimatePresence>
          {showConnectionBadge && activeConn && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Connected to {activeConn.name}
              </span>
              <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">
                ({activeConn.tables} tables)
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap justify-center gap-2 mb-4 w-full max-w-3xl"
        >
          {suggestions.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === i 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'bg-black/5 dark:bg-white/5 text-foreground/70 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {categoryIcons[cat.category] || <Sparkles className="w-4 h-4" />}
              {cat.category}
            </button>
          ))}
        </motion.div>

        {/* Suggestion Chips */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-2 w-full max-w-3xl mb-4"
        >
          {suggestions[activeCategory]?.prompts.slice(0, 3).map((sug, i) => (
            <motion.button 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => { setQuery(sug); if(onSearch) onSearch(sug); }}
              className="px-5 py-3.5 text-left rounded-xl bg-card hover:bg-muted transition-all text-[13px] font-medium text-foreground/80 flex items-center justify-between leading-relaxed border border-border hover:border-primary/30 group shadow-sm"
            >
              <span className="flex-1">{sug}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-3 shrink-0" />
            </motion.button>
          ))}
        </motion.div>



        {/* Input Area */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSearch}
          className="w-full max-w-3xl relative"
        >
          <div className="relative bg-card rounded-[24px] shadow-sm border border-border flex flex-col p-2 min-h-[120px] focus-within:border-primary/30 focus-within:shadow-[0_8px_30px_rgba(37,99,235,0.15)] transition-all">
            
            {/* Input */}
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the report you need..."
              className="w-full bg-transparent border-none outline-none text-foreground text-base p-4 resize-none placeholder:text-muted-foreground/60 min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-auto px-3 py-2">
              
              {/* Model Selector */}
              <button type="button" className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Repnex AI Pro
                <ChevronDown className="w-3 h-3 ml-1 text-muted-foreground" />
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button type="button" className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  disabled={!query.trim()}
                  className="w-9 h-9 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 disabled:bg-muted-foreground rounded-full transition-all shadow-lg shadow-primary/30 disabled:shadow-none group"
                >
                  <ArrowUp className="w-4 h-4 stroke-[3px] group-active:translate-y-[-2px] transition-transform" />
                </button>
              </div>

            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-4 px-2">
            <p>Repnex AI generates SQL queries from natural language</p>
            <p>
              <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">shift</span>
              {" + "}
              <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">return</span>
              {" for new line"}
            </p>
          </div>
        </motion.form>

      </div>
    </div>
  );
}
