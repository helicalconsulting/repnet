import { Mic, MicOff, ArrowUp, RefreshCw, Sparkles, ChevronDown, Database, Zap, TrendingUp, Package, DollarSign, Users, BookOpen, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { usePersonalization } from "../context/PersonalizationContext";
import { queryApi } from "../services/api";

const DEFAULT_SUGGESTIONS = [
  {
    category: "AP & Suppliers",
    prompts: [
      { text: "Show AP ageing report with 30-60-90 buckets", icon: "📊" },
      { text: "List overdue supplier invoices as of today", icon: "⚠️" },
      { text: "Top 10 suppliers by outstanding amount", icon: "🏆" },
      { text: "Supplier payment history last 3 months", icon: "💳" },
    ],
  },
  {
    category: "AR & Customers",
    prompts: [
      { text: "Customer ageing report with overdue buckets", icon: "📋" },
      { text: "Top 10 customers by outstanding receivables", icon: "📈" },
      { text: "Overdue customer invoices older than 60 days", icon: "⚠️" },
      { text: "Customer payment collection trend this quarter", icon: "💰" },
    ],
  },
  {
    category: "Cashbook & GL",
    prompts: [
      { text: "Cashbook summary for current month", icon: "💵" },
      { text: "GL journal entries posted today", icon: "📝" },
      { text: "Trial balance for current period", icon: "📑" },
      { text: "Bank reconciliation status report", icon: "🏦" },
    ],
  },
  {
    category: "Sales & Revenue",
    prompts: [
      { text: "Sales orders by customer this month", icon: "🛒" },
      { text: "Top 10 customers by revenue", icon: "🏆" },
      { text: "Monthly revenue trend last 6 months", icon: "📈" },
      { text: "Outstanding sales orders summary", icon: "📦" },
    ],
  },
];

import { motion, AnimatePresence } from "framer-motion";

export default function AIChatArea({ onSearch }) {
  const { connections, activeConnection, user } = useApp();
  const { getGreeting, getDisplayName } = usePersonalization();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [showConnectionBadge, setShowConnectionBadge] = useState(true);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  useEffect(() => {
    let active = true;
    queryApi.getSuggestions()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch dynamic suggestions, using fallbacks:", err);
      });
    return () => { active = false; };
  }, []);

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setQuery(prev => prev ? `${prev} ${text}` : text);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Safari, or Edge.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition already started:", err);
      }
    }
  };

  const activeConn = connections.find(c => c.id === activeConnection);
  const isViewer = user?.role === 'viewer';

  const categoryIcons = {
    "AP & Suppliers": <DollarSign className="w-4 h-4" />,
    "AR & Customers": <Users className="w-4 h-4" />,
    "Cashbook & GL": <BookOpen className="w-4 h-4" />,
    "Sales & Revenue": <TrendingUp className="w-4 h-4" />,
  };

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    if (isViewer) return;
    if (query.trim() && onSearch) {
      onSearch(query.replace('\n', ' '));
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-16 pb-4 px-6 w-full max-w-4xl mx-auto min-h-full relative z-10">
      
      {/* Background glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Center Content */}
      <div className="w-full flex flex-col items-center relative z-20">
        
        {/* Glowy Assistant Orb (Reverted to Normal Rounded) */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`w-16 h-16 rounded-full mb-4 relative cursor-pointer select-none transition-all duration-300 ${
            isListening 
              ? "shadow-[0_0_80px_rgba(239,68,68,0.7)] bg-gradient-to-b from-white via-rose-300 to-rose-600" 
              : "shadow-[0_0_60px_rgba(37,99,235,0.4)] bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb]"
          }`}
          onClick={toggleListening}
        >
          {/* Inner Breathing Glow */}
          <motion.div 
            animate={{ scale: isListening ? [1, 1.3, 1] : [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: isListening ? 1.5 : 3, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full blur-xl opacity-50 transition-all duration-300 ${
              isListening 
                ? "bg-gradient-to-b from-white via-rose-300 to-rose-600" 
                : "bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb]"
            }`}
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
            {getGreeting()}, {getDisplayName()}
          </h2>
          <p className="text-xs text-muted-foreground/70 w-72 mx-auto leading-relaxed">
            {isViewer ? "You have view-only access to reports" : "What report would you like to create today?"}
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
              onClick={() => { if (!isViewer && onSearch) { setQuery(sug.text); onSearch(sug.text); } }}
              disabled={isViewer}
              className={`px-5 py-3.5 text-left rounded-xl bg-card hover:bg-muted transition-all text-[13px] font-medium text-foreground/80 flex items-center justify-between leading-relaxed border border-border hover:border-primary/30 group shadow-sm ${isViewer ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="flex items-center gap-2 flex-1">
                <span className="text-base shrink-0">{sug.icon}</span>
                <span className="flex-1">{sug.text}</span>
              </span>
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
              placeholder={isViewer ? "Viewer role: Chat input is disabled" : "Describe the report you need..."}
              disabled={isViewer}
              className="w-full bg-transparent border-none outline-none text-foreground text-base p-4 resize-none placeholder:text-muted-foreground/60 min-h-[60px]"
              onKeyDown={(e) => {
                if (isViewer) return;
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
                <button 
                  type="button" 
                  onClick={toggleListening}
                  disabled={isViewer} 
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-all relative ${
                    isListening 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/50 animate-pulse scale-110" 
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                  } disabled:opacity-30`}
                  title={isListening ? "Listening... Click to stop" : "Voice input (Speech to text)"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {isListening && (
                    <span className="absolute inset-0 rounded-full border border-rose-500 animate-ping opacity-75" />
                  )}
                </button>
                <button 
                  type="submit" 
                  disabled={isViewer || !query.trim()}
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
