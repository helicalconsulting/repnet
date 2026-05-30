import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip, ArrowUp, Sparkles, Bot, User, Copy, Check, Loader2,
  Database, Code, Lightbulb, AlertCircle, Clock, Rows3, ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { queryApi, sessionsApi } from "../services/api";
import ParameterCard from "./ParameterCard";
import PipelineStatus from "./PipelineStatus";

export default function ChatConversation({ initialQuery, onOpenReport, sessionId }) {
  const { connections, activeConnection, addNotification } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef(null);

  const activeConn = connections.find((c) => c.id === activeConnection);

  // ── Process a user query ────────────────────────────────────────────
  const processQuery = useCallback(
    async (query) => {
      setIsProcessing(true);
      setShowSuggestions(false);
      setPipelineStep("classify");
      setCompletedSteps([]);

      // Add user message
      const userMsg = { id: Date.now().toString(), role: "user", content: query };
      setMessages((prev) => [...prev, userMsg]);

      try {
        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
          if (!activeConnection) {
            addNotification("error", "Please select a database connection first.");
            setIsProcessing(false);
            setPipelineStep(null);
            return;
          }
          try {
            const newSession = await sessionsApi.create({
              connection_id: activeConnection,
              title: query.slice(0, 50) || "New chat",
            });
            activeSessionId = newSession.id;
            setCurrentSessionId(activeSessionId);
            window.dispatchEvent(new Event("repnex-sessions-updated"));
          } catch (err) {
            console.error("Failed to create session:", err);
          }
        }

        // Simulate pipeline progression
        await new Promise((r) => setTimeout(r, 400));
        setCompletedSteps(["classify"]);
        setPipelineStep("search");

        await new Promise((r) => setTimeout(r, 300));
        setCompletedSteps(["classify", "search"]);
        setPipelineStep("extract");

        // Call the real backend
        const response = await queryApi.chat({
          naturalLanguage: query,
          connectionId: activeConnection || null,
          sessionId: activeSessionId || null,
        });

        setCompletedSteps(["classify", "search", "extract"]);

        const getCombinedSuggestions = (res) => {
          const sim = (res.candidates || [])
            .map((c) => c.description)
            .filter((d) => d && d !== res.template_description);
          const all = [...new Set([...sim.slice(0, 3), ...(res.suggestions || [])])];
          return all.slice(0, 5);
        };

        if (response.type === "conversational") {
          // Conversational response
          setPipelineStep(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "conversational",
              content: response.message,
            },
          ]);
          setCurrentSuggestions(getCombinedSuggestions(response));
          setShowSuggestions(true);

        } else if (response.type === "params_needed") {
          // Need user input for params
          setPipelineStep(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "params_needed",
              content: response.message,
              templateId: response.template_id,
              templateDescription: response.template_description,
              extractedParams: response.extracted_params || {},
              missingParams: response.missing_params || [],
            },
          ]);
          setCurrentSuggestions(getCombinedSuggestions(response));
          setShowSuggestions(true);

        } else if (response.type === "executable") {
          // Query executed successfully
          setPipelineStep("execute");
          await new Promise((r) => setTimeout(r, 300));
          setCompletedSteps(["classify", "search", "extract", "execute"]);
          setPipelineStep("insight");
          await new Promise((r) => setTimeout(r, 200));
          setCompletedSteps(["classify", "search", "extract", "execute", "insight"]);
          setPipelineStep(null);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "executable",
              content: response.summary || response.message,
              sql: response.sql,
              rows: response.rows,
              rowsReturned: response.rows_returned,
              executionTime: response.execution_time_ms,
              templateId: response.template_id,
              templateDescription: response.template_description,
              showReportBtn: true,
            },
          ]);
          setCurrentSuggestions(getCombinedSuggestions(response));
          setShowSuggestions(true);

        } else if (response.type === "template_preview") {
          // No DB connected - show template preview + SQL
          setPipelineStep(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "template_preview",
              content: response.message,
              sql: response.sql,
              templateId: response.template_id,
              templateDescription: response.template_description,
              templateModule: response.template_module,
            },
          ]);
          setCurrentSuggestions(getCombinedSuggestions(response));
          setShowSuggestions(true);

        } else {
          // Error
          setPipelineStep(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "error",
              content: response.message || "Something went wrong.",
            },
          ]);
          setCurrentSuggestions(response.suggestions || []);
          setShowSuggestions(response.suggestions?.length > 0);
        }
      } catch (err) {
        setPipelineStep(null);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            type: "error",
            content: `Error: ${err.message}`,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeConnection, currentSessionId, addNotification]
  );

  // ── Load session history ───────────────────────────────────────────
  useEffect(() => {
    if (sessionId) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const details = await sessionsApi.get(sessionId);
          // Map backend context window turns to frontend messages format
          const loaded = (details.context_window || []).map((turn, idx) => ({
            id: `history-${idx}-${Date.now()}`,
            role: turn.role === "user" ? "user" : "ai",
            content: turn.content,
            type: "conversational",
          }));
          setMessages(loaded);
          setCurrentSessionId(sessionId);
        } catch (err) {
          console.error("Failed to load session history:", err);
          addNotification("error", "Failed to load session chat history.");
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    } else {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [sessionId, addNotification]);

  // Process initial query
  useEffect(() => {
    if (initialQuery && !sessionId) {
      processQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pipelineStep]);

  // ── Execute with user-provided params ───────────────────────────────
  const handleParamSubmit = useCallback(
    async (templateId, params) => {
      if (!activeConnection) {
        addNotification("error", "Please select a database connection first.");
        return;
      }

      setIsProcessing(true);
      setPipelineStep("execute");
      setCompletedSteps(["classify", "search", "extract"]);

      try {
        const response = await queryApi.execute({
          templateId,
          params,
          connectionId: activeConnection,
          sessionId: currentSessionId || null,
        });

        setCompletedSteps(["classify", "search", "extract", "execute", "insight"]);
        setPipelineStep(null);

        if (response.type === "executable") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "executable",
              content: response.summary || response.message,
              sql: response.sql,
              rows: response.rows,
              rowsReturned: response.rows_returned,
              executionTime: response.execution_time_ms,
              templateId: response.template_id,
              showReportBtn: true,
            },
          ]);
          setCurrentSuggestions(response.suggestions || []);
          setShowSuggestions(true);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "error",
              content: response.message || "Execution failed.",
            },
          ]);
        }
      } catch (err) {
        setPipelineStep(null);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            type: "error",
            content: `Error: ${err.message}`,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeConnection, currentSessionId, addNotification]
  );

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    const query = inputValue.trim();
    setInputValue("");
    processQuery(query);
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification("success", "Copied to clipboard");
  };

  // ── Format message content ──────────────────────────────────────────
  const formatContent = (content) => {
    if (!content) return null;
    return content.split("\n").map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (line.startsWith("• ")) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: line.slice(2) }} />;
      }
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />;
      }
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center w-full h-full relative bg-background overflow-hidden">
      {/* Connection Status Bar */}
      {activeConn && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 dark:bg-[#1C1C1C]/80 backdrop-blur-md border border-border/50 dark:border-white/10 rounded-full text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground">Connected to</span>
            <span className="font-medium text-foreground">{activeConn.name}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl flex-1 flex flex-col pt-20 pb-40 px-6 overflow-y-auto custom-scrollbar">
        {loadingHistory ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-sm">Loading chat history...</span>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow shadow-blue-500/10">
                <Bot className="w-4 h-4 text-blue-700" />
              </div>
            )}

            <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
              <div
                className={`relative group ${
                  msg.role === "user"
                    ? "px-5 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm"
                    : msg.type === "error"
                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 rounded-2xl rounded-tl-sm p-5 shadow-sm"
                    : "bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="text-[15px] leading-relaxed">{msg.content}</span>
                ) : (
                  <div className="text-[15px] leading-relaxed text-foreground">
                    {msg.type === "error" && (
                      <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Could not process</span>
                      </div>
                    )}
                    {formatContent(msg.content)}
                  </div>
                )}

                {/* Copy button */}
                {msg.role === "ai" && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>

              {/* SQL display */}
              {msg.sql && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 w-full"
                >
                  <button
                    onClick={() => handleCopy(msg.sql, `sql-${msg.id}`)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1.5"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>SQL Query</span>
                    {copiedId === `sql-${msg.id}` && <Check className="w-3 h-3 text-emerald-500" />}
                  </button>
                  <pre className="p-3 bg-slate-900 dark:bg-black/40 text-slate-300 text-xs rounded-xl overflow-x-auto font-mono leading-relaxed border border-slate-800/50">
                    {msg.sql}
                  </pre>
                </motion.div>
              )}

              {/* Execution stats */}
              {msg.type === "executable" && (
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {msg.rowsReturned != null && (
                    <span className="flex items-center gap-1">
                      <Rows3 className="w-3.5 h-3.5" />
                      {msg.rowsReturned.toLocaleString()} rows
                    </span>
                  )}
                  {msg.executionTime != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {msg.executionTime}ms
                    </span>
                  )}
                </div>
              )}

              {/* Parameter Card for params_needed */}
              {msg.type === "params_needed" && (
                <div className="mt-4">
                  <ParameterCard
                    templateId={msg.templateId}
                    templateDescription={msg.templateDescription}
                    extractedParams={msg.extractedParams}
                    missingParams={msg.missingParams}
                    onSubmit={(params) => handleParamSubmit(msg.templateId, params)}
                    isLoading={isProcessing}
                  />
                </div>
              )}

              {/* Report Button */}
              {msg.showReportBtn && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4"
                >
                  <button
                    onClick={() => onOpenReport(initialQuery, { rows: msg.rows, sql: msg.sql })}
                    className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground rounded-xl transition-all shadow-lg shadow-primary/30 group font-medium text-sm"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>View Interactive Report</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">with charts & data</span>
                  </button>
                </motion.div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center ml-3 shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        )))}

        {/* Pipeline Status during processing */}
        {isProcessing && pipelineStep && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full mb-6 justify-start"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow shadow-blue-500/10">
              <Bot className="w-4 h-4 text-blue-700" />
            </div>
            <PipelineStatus currentStep={pipelineStep} completedSteps={completedSteps} />
          </motion.div>
        )}

        {/* Typing indicator (no pipeline yet) */}
        {isProcessing && !pipelineStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full mb-6 justify-start items-center"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow shadow-blue-500/10">
              <Bot className="w-4 h-4 text-blue-700" />
            </div>
            <div className="flex gap-1.5 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 px-5 py-4 rounded-2xl rounded-tl-sm">
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </motion.div>
        )}

        {/* Follow-up suggestions */}
        <AnimatePresence>
          {showSuggestions && !isProcessing && currentSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-6 pl-12"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Suggestions:</span>
              </div>
              {currentSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setShowSuggestions(false);
                    processQuery(typeof sug === "string" ? sug : sug.text || sug);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 hover:border-primary/50 rounded-lg transition-colors"
                >
                  {typeof sug === "string" ? sug : sug.text || sug}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-4 w-full shrink-0 block" />
      </div>

      {/* Fixed Bottom Input */}
      <div className="absolute bottom-0 w-full left-0 right-0 px-6 pb-6 bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9]/95 dark:from-[#141414] dark:via-[#141414]/95 to-transparent z-10 pt-10 flex justify-center pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-3xl pointer-events-auto bg-card dark:bg-[#1C1C1C] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-border/50 dark:border-white/5 flex flex-col p-2 min-h-[90px] focus-within:border-primary/30 focus-within:shadow-[0_8px_30px_rgba(37,99,235,0.15)] transition-all"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="w-full bg-transparent border-none outline-none text-foreground text-[15px] p-3 resize-none placeholder:text-muted-foreground/60 min-h-[44px] max-h-[200px] overflow-y-auto"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between mt-auto px-2 py-1">
            <button
              type="button"
              className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/70 hover:text-foreground transition-colors px-2 py-1 rounded bg-black/5 dark:bg-white/5"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              Repnex AI Pro
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 disabled:bg-muted-foreground rounded-full transition-all shadow-lg shadow-primary/30 disabled:shadow-none group"
              >
                <ArrowUp className="w-4 h-4 stroke-[3px] group-active:translate-y-[-2px] transition-transform" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
