import { Mic, MicOff, ArrowUp, RefreshCw, Sparkles, Database, TrendingUp, DollarSign, Users, BookOpen, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { usePersonalization } from "../context/PersonalizationContext";
import { queryApi } from "../services/api";
import { ProductMark, StatusPill } from "./ui/product-ui";
import ModelProviderMenu from "./ModelProviderMenu";

import { motion, AnimatePresence } from "framer-motion";

export default function AIChatArea({ onSearch }) {
  const { connections, activeConnection, user } = useApp();
  const { getGreeting, getDisplayName } = usePersonalization();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showQueriesDrawer, setShowQueriesDrawer] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasFetchedDynamic, setHasFetchedDynamic] = useState(false);

  // Fetch suggestions from backend only when drawer is opened and we haven't fetched them yet
  useEffect(() => {
    if (showQueriesDrawer && !hasFetchedDynamic) {
      setIsLoadingSuggestions(true);
      queryApi.getSuggestions(activeConnection || null)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
            setHasFetchedDynamic(true);
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch dynamic suggestions:", err);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    }
  }, [showQueriesDrawer, activeConnection, hasFetchedDynamic]);

  // Reset fetched flag when connection changes so it pulls fresh suggestions on next open
  useEffect(() => {
    setHasFetchedDynamic(false);
    setSuggestions([]);
  }, [activeConnection]);

  useEffect(() => {
    if (!showQueriesDrawer) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowQueriesDrawer(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showQueriesDrawer]);

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
    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[900px] flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] max-w-[100vw] -translate-x-1/2 rounded-full bg-primary/8 blur-[110px]" />

      <div className="relative z-20 flex w-full flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 text-center"
        >
          <h2 className="page-heading brand-text-gradient text-3xl font-semibold sm:text-4xl">
            {getGreeting()}, {getDisplayName()}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            {isViewer
              ? "Explore saved reports and shared analysis from your workspace."
              : "Ask a business question. Repnex will find the right ERP data and build the report with you."}
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          {activeConn ? (
            <StatusPill tone="success">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <Database className="h-3.5 w-3.5" />
              {activeConn.name}
              {activeConn.tables ? <span className="opacity-70">· {activeConn.tables} tables</span> : null}
            </StatusPill>
          ) : (
            <StatusPill tone="warning">
              <Database className="h-3.5 w-3.5" />
              Choose a connection to use live data
            </StatusPill>
          )}

          {!isViewer ? (
            <button
              type="button"
              onClick={() => setShowQueriesDrawer(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-border/70 bg-white/60 dark:bg-white/10 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/80 dark:hover:bg-white/20 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              Explore Prompt Ideas
            </button>
          ) : null}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onSubmit={handleSearch}
          className="w-full max-w-[900px]"
        >
          <div className="prompt-shell flex min-h-[132px] flex-col rounded-[24px] p-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isViewer ? "Chat is unavailable for viewer accounts" : "Ask about revenue, orders, inventory, suppliers..."}
              disabled={isViewer}
              className="chat-composer-input min-h-[72px] w-full resize-none border-none bg-transparent p-4 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/70"
              onKeyDown={(e) => {
                if (isViewer) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />

            <div className="mt-auto flex items-center justify-between gap-3 px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <ModelProviderMenu />
                <span className="hidden text-[11px] text-muted-foreground sm:inline">Enter to send · Shift + Enter for a new line</span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isViewer}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    isListening
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } disabled:opacity-30`}
                  title={isListening ? "Stop listening" : "Voice input"}
                  aria-label={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="submit"
                  disabled={isViewer || !query.trim()}
                  className="brand-gradient group flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30 disabled:shadow-none"
                  aria-label="Send question"
                >
                  <ArrowUp className="h-4 w-4 stroke-[2.5px]" />
                </button>
              </div>
            </div>
          </div>
        </motion.form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/75">
          Repnex may make mistakes. Review important results before sharing them.
        </p>
      </div>

      {/* Dynamic Suggestions Drawer */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showQueriesDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQueriesDrawer(false)}
                className="fixed inset-0 z-[80] cursor-pointer bg-slate-950/35 backdrop-blur-[2px]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="workspace-canvas fixed inset-y-0 right-0 z-[90] flex h-dvh w-full max-w-md flex-col overflow-hidden border-l border-border/70 text-left shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="query-ideas-title"
              >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border/60 bg-background/95 px-5 py-5 backdrop-blur-xl sm:px-6">
                <div>
                  <h3 id="query-ideas-title" className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <ProductMark className="h-8 w-8" />
                    Query ideas
                  </h3>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                    Useful questions based on the tables in your selected connection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQueriesDrawer(false)}
                  autoFocus
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close query ideas"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Suggestions Loading/Content */}
              <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
                {isLoadingSuggestions ? (
                  <div className="app-card flex flex-col items-center justify-center gap-3 rounded-2xl py-10 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm">Finding useful questions...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="app-card flex flex-col items-center gap-2 rounded-2xl px-5 py-10 text-center text-sm text-muted-foreground">
                    <Database className="mb-1 h-8 w-8 text-muted-foreground/40" />
                    <span>
                      {!activeConnection
                        ? "Choose a database connection to see relevant query ideas."
                        : "No query ideas are available for this connection yet."
                      }
                    </span>
                  </div>
                ) : (
                  suggestions.map((mod, modIdx) => (
                    <div key={modIdx} className="flex flex-col gap-3 border-b border-border/50 pb-5 last:border-0 last:pb-0">
                      {/* Module Title */}
                      <h4 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                        <span className="h-3.5 w-1 rounded-full bg-primary" />
                        {mod.module || "General Modules"}
                      </h4>
                      
                      {/* Submodules & Prompts */}
                      <div className="flex flex-col gap-4">
                        {mod.submodules?.map((sub, subIdx) => (
                          <div key={subIdx} className="flex flex-col gap-2">
                            <h5 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              {categoryIcons[sub.name] || <Sparkles className="h-3.5 w-3.5 text-primary" />}
                              {sub.name}
                            </h5>
                            <div className="flex flex-col gap-2">
                              {sub.prompts?.map((sug, sugIdx) => (
                                <button
                                  key={sugIdx}
                                  onClick={() => {
                                    if (!isViewer && onSearch) {
                                      setQuery(sug.text);
                                      onSearch(sug.text);
                                      setShowQueriesDrawer(false);
                                    }
                                  }}
                                  disabled={isViewer}
                                  className="interactive-card app-card group flex w-full items-start justify-between gap-3 rounded-xl p-3 text-left text-xs font-medium text-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <span className="flex items-start gap-2">
                                    <span className="text-sm select-none shrink-0">{sug.icon || "📊"}</span>
                                    <span className="leading-normal">{sug.text}</span>
                                  </span>
                                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
