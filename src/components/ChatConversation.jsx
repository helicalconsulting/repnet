import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown, ArrowUp, Sparkles, Copy, Check,
  Database, Lightbulb, AlertCircle, Clock, Rows3, ChevronDown, ChevronUp, Calendar,
  Edit2, RotateCcw, Square, ThumbsUp, ThumbsDown, Mic, MicOff, Plus
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePersonalization } from "../context/PersonalizationContext";
import { queryApi, sessionsApi, organizationApi, getToken } from "../services/api";
import ParameterCard from "./ParameterCard";
import PipelineStatus from "./PipelineStatus";
import ReportBuilder from "./ReportBuilder";
import ModelProviderMenu from "./ModelProviderMenu";
import { format } from "date-fns";
import { ProductMark, StatusPill } from "./ui/product-ui";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./ui/sheet";

export default function ChatConversation({ initialQuery, onOpenReport, sessionId, onSessionCreated }) {
  const { connections, activeConnection, selectActiveConnection, addNotification, user } = useApp();
  const { getCasualResponse, profile } = usePersonalization();
  const { setHeaderConfig } = useOutletContext() || {};

  const activeConn = connections.find((c) => c.id === activeConnection);

  useEffect(() => {
    if (setHeaderConfig) {
      setHeaderConfig({
        hidden: true,
      });
    }
    return () => {
      if (setHeaderConfig) {
        setHeaderConfig({ hidden: false });
      }
    };
  }, [setHeaderConfig]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStatusText, setCurrentStatusText] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const composerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const loadedSessionIdRef = useRef(null);
  const hasProcessedInitialRef = useRef(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const socketRef = useRef(null);
  const socketSessionIdRef = useRef(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [collapsedSummaries, setCollapsedSummaries] = useState({});
  const [collapsedSQLs, setCollapsedSQLs] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // ── Report preview popup (shown instead of navigating when WS is active) ──
  const [previewReport, setPreviewReport] = useState(null); // { query, data }
  const [showReportPreview, setShowReportPreview] = useState(false);

  const progressQueue = useRef([]);
  const progressTimer = useRef(null);
  const isWaitingForComplete = useRef(false);
  const hasSuggestionsRef = useRef(false);

  const processNextStep = useCallback(() => {
    if (progressTimer.current || progressQueue.current.length === 0) {
      if (progressQueue.current.length === 0 && isWaitingForComplete.current && !progressTimer.current) {
        isWaitingForComplete.current = false;
        setIsProcessing(false);
        setPipelineStep(null);
        setCurrentStatusText("");
        setShowSuggestions(hasSuggestionsRef.current);
      }
      return;
    }

    const next = progressQueue.current.shift();
    setPipelineStep(next.step);
    setCompletedSteps(next.completed);
    setCurrentStatusText(next.statusText);

    progressTimer.current = setTimeout(() => {
      progressTimer.current = null;
      processNextStep();
    }, 700);
  }, []);

  const enqueueStep = useCallback((step, completed, statusText) => {
    const alreadyInQueue = progressQueue.current.some(q => q.step === step);
    if (alreadyInQueue || pipelineStep === step) return;
    progressQueue.current.push({ step, completed, statusText });
    processNextStep();
  }, [pipelineStep, processNextStep]);

  // Initialize Web Speech API SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInputValue((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript}` : finalTranscript;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          addNotification("error", "Microphone access denied. Please check your browser permissions.");
        } else {
          addNotification("error", `Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [addNotification]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      addNotification("error", "Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  }, [isListening, addNotification]);

  const isMessageCollapsible = (message) => {
    if (!message?.content || message.type === "error") return false;
    return message.content.length > 520 || message.content.split("\n").length > 7;
  };

  const isSummaryCollapsed = (message) => {
    if (!isMessageCollapsible(message)) return false;
    return collapsedSummaries[message.id] !== false;
  };

  const toggleSummaryCollapse = (message) => {
    setCollapsedSummaries(prev => ({
      ...prev,
      [message.id]: !isSummaryCollapsed(message)
    }));
  };

  const toggleSqlCollapse = (id) => {
    setCollapsedSQLs(prev => ({
      ...prev,
      [id]: !isSqlCollapsed(id)
    }));
  };

  const isSqlCollapsed = (id) => {
    return collapsedSQLs[id] !== false;
  };


  const handleFeedbackSubmit = async (msgId, historyId, isPositive) => {
    try {
      await queryApi.submitFeedback(historyId, { isPositive });
      setFeedbacks((prev) => ({
        ...prev,
        [msgId]: { submitted: true, isPositive },
      }));
      addNotification("success", "Feedback submitted successfully.");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      addNotification("error", "Failed to submit feedback.");
    }
  };

  const handleFeedbackNegativeClick = (msgId) => {
    setFeedbacks((prev) => ({
      ...prev,
      [msgId]: { submitted: false, isPositive: false, category: "Wrong Output", comment: "" },
    }));
  };

  const handleFeedbackCategoryChange = (msgId, category) => {
    setFeedbacks((prev) => ({
      ...prev,
      [msgId]: { ...prev[msgId], category },
    }));
  };

  const handleFeedbackCommentChange = (msgId, comment) => {
    setFeedbacks((prev) => ({
      ...prev,
      [msgId]: { ...prev[msgId], comment },
    }));
  };

  const handleFeedbackCancel = (msgId) => {
    setFeedbacks((prev) => {
      const copy = { ...prev };
      delete copy[msgId];
      return copy;
    });
  };

  const handleFeedbackNegativeSubmit = async (msgId, historyId) => {
    const fb = feedbacks[msgId];
    try {
      await queryApi.submitFeedback(historyId, {
        isPositive: false,
        category: fb.category,
        comment: fb.comment,
      });
      setFeedbacks((prev) => ({
        ...prev,
        [msgId]: { ...fb, submitted: true },
      }));
      addNotification("success", "Feedback submitted successfully.");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      addNotification("error", "Failed to submit feedback.");
    }
  };

  const isViewer = user?.role === 'viewer';

  const getWsServerUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE || 'https://api.helical.consulting/v1';
    let wsBase = apiBase.replace(/\/v1\/?$/, '');
    wsBase = wsBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return wsBase;
  };

  const handleCancel = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "cancel" }));
      socketRef.current.close();
    }
    setIsProcessing(false);
    setPipelineStep(null);
    setCurrentStatusText("");
    progressQueue.current = [];
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
    isWaitingForComplete.current = false;
  }, []);

  // ── Process a user query ────────────────────────────────────────────
  const processQuery = useCallback(
    async (query) => {
      if (isViewer) return;
      isNearBottomRef.current = true;
      setShowScrollToLatest(false);
      setIsProcessing(true);
      setShowSuggestions(false);

      const getCombinedSuggestions = (res) => {
        const sim = (res.candidates || [])
          .map((c) => c.description)
          .filter((d) => d && d !== res.template_description);
        const all = [...new Set([...sim.slice(0, 3), ...(res.suggestions || [])])];
        return all.slice(0, 4);
      };

      // Handle casual greetings locally with personalized response
      const casualResponse = getCasualResponse(query);
      if (casualResponse) {
        const userMsg = { id: `user-${Date.now()}`, role: "user", content: query, timestamp: new Date().toISOString() };
        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: "ai",
          type: "conversational",
          content: casualResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg, aiMsg]);
        setIsProcessing(false);
        return;
      }

      progressQueue.current = [];
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
        progressTimer.current = null;
      }
      isWaitingForComplete.current = false;
      hasSuggestionsRef.current = false;

      enqueueStep("classify", [], "Classifying intent");
      enqueueStep("search", ["classify"], "Searching templates");

      // Add user message
      const userMsgId = `user-${Date.now()}`;
      const userMsg = { id: userMsgId, role: "user", content: query, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const isValidUuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
        let activeSessionId = (sessionId && isValidUuid(sessionId))
          ? sessionId
          : (currentSessionId && isValidUuid(currentSessionId) ? currentSessionId : null);

        if (!activeSessionId) {
          try {
            const newSession = await sessionsApi.create({
              title: query.slice(0, 60) || "New chat",
              connection_id: activeConnection || undefined,
            });
            console.log('[Chat] Session created:', newSession);
            if (newSession?.id) {
              activeSessionId = newSession.id;
              loadedSessionIdRef.current = activeSessionId;
              setCurrentSessionId(activeSessionId);
              window.dispatchEvent(new Event("repnex-sessions-updated"));
              if (onSessionCreated) {
                onSessionCreated(activeSessionId);
              }
            } else {
              console.warn('[Chat] Session created but no ID returned:', newSession);
            }
          } catch (err) {
            console.error('[Chat] Session create failed:', err?.message || err);
          }
        }

        if (activeConnection) {
          // WebSocket execution path for live progress and cancellation.
          const wsUrl = `${getWsServerUrl()}/ws/query/${activeSessionId}?token=${getToken()}`;
          const ws = new WebSocket(wsUrl);
          socketRef.current = ws;
          socketSessionIdRef.current = activeSessionId;

          const aiMsgId = `ai-${Date.now()}`;

          let timeoutTimer = null;
          const resetTimeout = () => {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            timeoutTimer = setTimeout(() => {
              console.warn("[WS] No message received for 45 seconds, timing out.");
              try {
                ws.close();
              } catch {
                // The socket may already be closed.
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId && m.isStreaming
                    ? {
                      ...m,
                      type: "error",
                      content: "Query execution timed out. No response from server.",
                      isStreaming: false,
                    }
                    : m
                )
              );
              setIsProcessing(false);
              setPipelineStep(null);
              setCurrentStatusText("");
            }, 45000);
          };

          const clearWSTimeout = () => {
            if (timeoutTimer) {
              clearTimeout(timeoutTimer);
              timeoutTimer = null;
            }
          };

          resetTimeout();

          const upsertAIMessage = (fields) => {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === aiMsgId);
              if (exists) {
                return prev.map((m) => (m.id === aiMsgId ? { ...m, ...fields } : m));
              } else {
                return [
                  ...prev,
                  {
                    id: aiMsgId,
                    role: "ai",
                    type: "conversational",
                    content: "",
                    sql: null,
                    rows: [],
                    columns: null,
                    rowsReturned: 0,
                    executionTime: 0,
                    isStreaming: true,
                    timestamp: new Date().toISOString(),
                    ...fields,
                  },
                ];
              }
            });
          };

          ws.onopen = () => {
            resetTimeout();
            ws.send(JSON.stringify({
              action: "run_query",
              natural_language: query,
            }));
          };

          ws.onmessage = (e) => {
            resetTimeout();
            const event = JSON.parse(e.data);
            if (event.type === "status") {
              setCurrentStatusText(event.message);
            } else if (event.type === "progress") {
              if (event.step === "intent_extraction") {
                // Already enqueued at the start of the query
              } else if (event.step === "sql_build") {
                enqueueStep("extract", ["classify", "search"], "Building query");
              } else if (event.step === "execute") {
                enqueueStep("execute", ["classify", "search", "extract"], "Executing query");
              } else if (event.step === "insight") {
                enqueueStep("insight", ["classify", "search", "extract", "execute"], "Generating insights");
              }
            } else if (event.type === "sql") {
              upsertAIMessage({ type: "executable", sql: event.sql });
            } else if (event.type === "data") {
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === aiMsgId);
                if (exists) {
                  return prev.map((m) => {
                    if (m.id === aiMsgId) {
                      const newRows = [...(m.rows || []), ...(event.rows || [])];
                      const cols = m.columns || ((event.rows && event.rows[0]) ? Object.keys(event.rows[0]) : null);
                      return {
                        ...m,
                        type: "executable",
                        rows: newRows,
                        columns: cols,
                        rowsReturned: newRows.length,
                      };
                    }
                    return m;
                  });
                } else {
                  const cols = (event.rows && event.rows[0]) ? Object.keys(event.rows[0]) : null;
                  return [
                    ...prev,
                    {
                      id: aiMsgId,
                      role: "ai",
                      type: "executable",
                      content: "",
                      sql: null,
                      rows: event.rows || [],
                      columns: cols,
                      rowsReturned: (event.rows || []).length,
                      executionTime: 0,
                      isStreaming: true,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                }
              });
            } else if (event.type === "insight") {
              upsertAIMessage({ content: event.summary });
            } else if (event.type === "complete") {
              clearWSTimeout();
              const backendSugs = getCombinedSuggestions(event);
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === aiMsgId);
                if (exists) {
                  return prev.map((m) => {
                    if (m.id === aiMsgId) {
                      const isExec = m.type === "executable" || !!m.sql;
                      return {
                        ...m,
                        isStreaming: false,
                        showReportBtn: isExec,
                        content: m.content || event.summary || "",
                        type: isExec ? "executable" : (m.type || "conversational"),
                        rowsReturned: event.rows_returned,
                        executionTime: event.exec_time_ms,
                        historyId: event.history_id,
                        suggestions: backendSugs,
                        colMeta: event.col_meta || null,
                        columns: event.columns || m.columns,
                      };
                    }
                    return m;
                  });
                } else {
                  const isExec = false;
                  return [
                    ...prev,
                    {
                      id: aiMsgId,
                      role: "ai",
                      type: "conversational",
                      content: event.summary || "",
                      sql: null,
                      rows: [],
                      columns: event.columns,
                      rowsReturned: event.rows_returned,
                      executionTime: event.exec_time_ms,
                      isStreaming: false,
                      showReportBtn: false,
                      historyId: event.history_id,
                      suggestions: backendSugs,
                      colMeta: event.col_meta || null,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                }
              });
              setCurrentSuggestions(backendSugs);
              ws.close();
              window.dispatchEvent(new Event("repnex-sessions-updated"));

              // Defer final pipeline hiding until queue drains
              hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
              isWaitingForComplete.current = true;
              processNextStep();
            } else if (event.type === "error") {
              clearWSTimeout();
              let userFriendlyMsg = "Could not process. An error occurred while executing the query. Please verify your query or database schema and try again.";
              if (event.code === "validation_failed" || event.code === "forbidden" || event.code === "access_denied") {
                userFriendlyMsg = event.message;
              } else if (event.code === "target_db_error") {
                userFriendlyMsg = `Could not process. Database execution failed:\n\n${event.message}\n\nPlease verify your query or database schema and try again.`;
              } else if (event.message) {
                userFriendlyMsg = `Could not process. ${event.message}`;
              }

              upsertAIMessage({
                type: (event.code === "validation_failed" || event.code === "forbidden" || event.code === "access_denied") ? "conversational" : "error",
                content: userFriendlyMsg,
                isStreaming: false,
                historyId: event.history_id || null,
              });
              ws.close();
              setIsProcessing(false);
              setPipelineStep(null);
              setCurrentStatusText("");
              progressQueue.current = [];
              if (progressTimer.current) {
                clearTimeout(progressTimer.current);
                progressTimer.current = null;
              }
              isWaitingForComplete.current = false;
            }
          };

          ws.onerror = (err) => {
            clearWSTimeout();
            console.error("WS error:", err);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, type: "error", content: "Connection error. Failed to stream results.", isStreaming: false }
                  : m
              )
            );
            setIsProcessing(false);
            setPipelineStep(null);
            setCurrentStatusText("");
            progressQueue.current = [];
            if (progressTimer.current) {
              clearTimeout(progressTimer.current);
              progressTimer.current = null;
            }
            isWaitingForComplete.current = false;
          };

          ws.onclose = () => {
            clearWSTimeout();
            socketRef.current = null;
            setIsProcessing(false);
            setPipelineStep(null);
            setCurrentStatusText("");

            // Safety cleanup: stop streaming indicator & display report button if executable SQL exists
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId && m.isStreaming
                  ? { ...m, isStreaming: false, showReportBtn: m.type === "executable" || !!m.sql }
                  : m
              )
            );
          };
        } else {
          // REST Fallback (Direct execution when no connection is active)
          enqueueStep("extract", ["classify", "search"], "Building query");

          const response = await queryApi.chat({
            naturalLanguage: query,
            connectionId: activeConnection || null,
            sessionId: activeSessionId || null,
            personalization: {
              display_name: profile.displayName || '',
              preferred_name: profile.preferredName || '',
              greeting_style: profile.greetingStyle || 'time-based',
              ai_tone: profile.aiTone || 'friendly',
            },
          });

          if (response.type === "conversational") {
            const backendSugs = getCombinedSuggestions(response);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                type: "conversational",
                content: response.message,
                suggestions: backendSugs,
                timestamp: new Date().toISOString(),
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();

          } else if (response.type === "params_needed") {
            const backendSugs = getCombinedSuggestions(response);
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
                suggestions: backendSugs,
                timestamp: new Date().toISOString(),
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();

          } else if (response.type === "executable") {
            enqueueStep("execute", ["classify", "search", "extract"], "Executing query");
            enqueueStep("insight", ["classify", "search", "extract", "execute"], "Generating insights");

            const backendSugs = getCombinedSuggestions(response);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                type: "executable",
                content: response.summary || response.message,
                sql: response.sql,
                rows: response.rows || [],
                columns: response.columns || (response.rows && response.rows[0] ? Object.keys(response.rows[0]) : []),
                rowsReturned: response.rows_returned || 0,
                executionTime: response.execution_time_ms || 0,
                templateId: response.template_id,
                templateDescription: response.template_description,
                extractedParams: response.extracted_params || {},
                showReportBtn: true,
                historyId: response.history_id,
                suggestions: backendSugs,
                colMeta: response.col_meta || null,   // ← axis hints from backend
                timestamp: new Date().toISOString(),
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();

          } else if (response.type === "template_preview") {
            const backendSugs = getCombinedSuggestions(response);
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
                historyId: response.history_id || null,
                suggestions: backendSugs,
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();

          } else if (response.type === "access_denied") {
            const backendSugs = (response.suggestions || []).slice(0, 4);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                type: "error",
                content: response.message || "Access denied to this module.",
                templateModule: response.template_module,
                historyId: response.history_id || null,
                suggestions: backendSugs,
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();

          } else {
            const backendSugs = getCombinedSuggestions(response);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                type: "error",
                content: response.message || "Something went wrong.",
                historyId: response.history_id || null,
                suggestions: backendSugs,
              },
            ]);
            setCurrentSuggestions(backendSugs);
            hasSuggestionsRef.current = backendSugs && backendSugs.length > 0;
            isWaitingForComplete.current = true;
            processNextStep();
          }
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
            historyId: err.historyId || null,
          },
        ]);
      } finally {
        if (!activeConnection) {
          setIsProcessing(false);
        }
      }
    },
    [
      activeConnection,
      sessionId,
      currentSessionId,
      profile,
      getCasualResponse,
      isViewer,
      onSessionCreated,
      enqueueStep,
      processNextStep,
    ]
  );

  const handleEditStart = useCallback((msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  }, []);

  const handleEditSave = useCallback(async (msgId) => {
    const msgIdx = messages.findIndex((m) => m.id === msgId);
    if (msgIdx === -1) return;

    const textToSubmit = editingText.trim();
    if (!textToSubmit) return;

    setEditingMessageId(null);
    setIsProcessing(true);

    try {
      const activeSessionId = sessionId || currentSessionId;
      if (activeSessionId) {
        await sessionsApi.editTurn(activeSessionId, msgIdx);
      }
      setMessages((prev) => prev.slice(0, msgIdx));
      await processQuery(textToSubmit);
    } catch (err) {
      console.error("Failed to edit turn:", err);
      addNotification("error", "Failed to edit query: " + err.message);
      setIsProcessing(false);
    }
  }, [messages, sessionId, currentSessionId, processQuery, addNotification, editingText]);

  const findPreviousQuestion = useCallback((messageId) => {
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    if (messageIndex < 0) return null;
    return messages.slice(0, messageIndex).reverse().find((message) => message.role === "user") || null;
  }, [messages]);

  const handleRetryResponse = useCallback((messageId) => {
    const previousQuestion = findPreviousQuestion(messageId);
    if (previousQuestion?.content) processQuery(previousQuestion.content);
  }, [findPreviousQuestion, processQuery]);

  const handleEditPreviousQuestion = useCallback((messageId) => {
    const previousQuestion = findPreviousQuestion(messageId);
    if (!previousQuestion) return;
    handleEditStart(previousQuestion);
    window.requestAnimationFrame(() => {
      document.getElementById(`message-${previousQuestion.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [findPreviousQuestion, handleEditStart]);

  // ── Load session history ───────────────────────────────────────────
  useEffect(() => {
    const isValidUuid = (str) => {
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    };

    if (sessionId && isValidUuid(sessionId)) {
      if (sessionId === loadedSessionIdRef.current) {
        return; // Already loaded or just created this session, do nothing!
      }
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const details = await sessionsApi.get(sessionId);

          // Sync the active database connection with the loaded session's connection
          if (details?.connection_id && details.connection_id !== activeConnection) {
            selectActiveConnection(details.connection_id);
          }

          // Map backend context window turns to frontend messages format preserving rich fields
          const loaded = (details.context_window || []).map((turn, idx) => ({
            id: `history-${idx}-${details.id}`,
            role: turn.role === "user" ? "user" : "ai",
            content: turn.content,
            type: turn.type || "conversational",
            sql: turn.sql || null,
            rows: turn.rows || null,
            columns: turn.columns || null,
            rowsReturned: turn.rows_returned || turn.rowsReturned || null,
            executionTime: turn.execution_time_ms || turn.executionTime || null,
            templateId: turn.template_id || turn.templateId || null,
            templateDescription: turn.template_description || turn.templateDescription || "",
            extractedParams: turn.extracted_params || turn.extractedParams || {},
            suggestions: turn.suggestions || [],
            showReportBtn: turn.type === "executable",
            historyId: turn.history_id || turn.historyId || null,
            timestamp: turn.timestamp || null,
          }));
          setMessages(loaded);
          loadedSessionIdRef.current = sessionId;
          setCurrentSessionId(sessionId);

          // Restore suggestions from the last AI message in history
          const lastAiMsg = [...loaded].reverse().find(m => m.role === "ai");
          if (lastAiMsg?.suggestions?.length > 0) {
            const cleanSuggestions = lastAiMsg.suggestions.slice(0, 4);
            setCurrentSuggestions(cleanSuggestions);
            setShowSuggestions(cleanSuggestions.length > 0);
          } else {
            setShowSuggestions(false);
          }
        } catch (err) {
          console.error("Failed to load session history:", err);
          addNotification("error", "Failed to load session chat history.");
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    } else {
      // Clear messages if we had a session loaded before and navigated away
      if (loadedSessionIdRef.current !== null) {
        setMessages([]);
        loadedSessionIdRef.current = null;
        setCurrentSessionId(null);
      }
    }
  }, [sessionId, addNotification, activeConnection, selectActiveConnection]);

  // Process initial query on fresh mount (new chat from landing page)
  useEffect(() => {
    if (initialQuery && !sessionId && !hasProcessedInitialRef.current) {
      hasProcessedInitialRef.current = true;
      processQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToLatest = useCallback((behavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setShowScrollToLatest(false);
  }, []);

  const handleConversationScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = isNearBottom;
    if (isNearBottom) setShowScrollToLatest(false);
  }, []);

  // Follow new content only while the user is already reading the latest message.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (isNearBottomRef.current) {
        scrollToLatest("smooth");
      } else {
        setShowScrollToLatest(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, pipelineStep, isProcessing, showSuggestions, scrollToLatest]);

  useEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollToLatest(false);
  }, [sessionId]);

  // Grow the composer with the question, up to a comfortable maximum height.
  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 200)}px`;
  }, [inputValue]);

  // Fix Recharts ResponsiveContainer rendering zero width/height inside flex/animated components
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 250);
    return () => clearTimeout(timer);
  }, [messages]);

  // Close active WebSocket if session changes or component unmounts
  useEffect(() => {
    if (socketRef.current && socketSessionIdRef.current !== sessionId) {
      console.log("[Chat] Closing socket due to session change from", socketSessionIdRef.current, "to", sessionId);
      socketRef.current.close();
      socketRef.current = null;
      setIsProcessing(false);
      setPipelineStep(null);
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("[Chat] Component unmounting, closing active socket");
        socketRef.current.close();
        socketRef.current = null;
      }
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
        progressTimer.current = null;
      }
    };
  }, []);

  // ── Execute with user-provided params ───────────────────────────────
  const handleParamSubmit = useCallback(
    async (templateId, params) => {
      if (isViewer) return;
      if (!activeConnection) {
        addNotification("error", "Please select a database connection first.");
        return;
      }

      setIsProcessing(true);
      setPipelineStep("execute");
      setCompletedSteps(["classify", "search", "extract"]);

      try {
        const isValidUuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
        const activeSessionId = (sessionId && isValidUuid(sessionId)) ? sessionId : null;

        const response = await queryApi.execute({
          templateId,
          params,
          connectionId: activeConnection,
          sessionId: activeSessionId,
        });

        setCompletedSteps(["classify", "search", "extract", "execute", "insight"]);
        setPipelineStep(null);

        if (response.type === "executable") {
          const backendSugs = (response.suggestions || []).slice(0, 4);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "ai",
              type: "executable",
              content: response.summary || response.message,
              sql: response.sql,
              rows: response.rows,
              columns: response.columns,
              rowsReturned: response.rows_returned,
              executionTime: response.execution_time_ms,
              templateId: response.template_id,
              templateDescription: response.template_description || "",
              extractedParams: params || {},
              showReportBtn: true,
              suggestions: backendSugs,
            },
          ]);
          setCurrentSuggestions(backendSugs);
          setShowSuggestions(backendSugs.length > 0);
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
    [activeConnection, sessionId, addNotification, isViewer]
  );

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isViewer) return;
    if (!inputValue.trim() || isProcessing) return;
    const query = inputValue.trim();
    setInputValue("");
    processQuery(query);
  };

  const handleCopy = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      addNotification("success", "Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy content:", error);
      addNotification("error", "Could not copy to clipboard.");
    }
  };

  const highlightSQL = (sql) => {
    if (!sql) return "";

    // List of SQL keywords (uppercase)
    const keywords = new Set([
      "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "LIMIT", "HAVING",
      "LEFT", "RIGHT", "INNER", "JOIN", "ON", "AS", "AND", "OR", "UNION",
      "ALL", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE", "IN", "IS", "NULL"
    ]);

    // List of SQL functions
    const functions = new Set([
      "COALESCE", "CAST", "SUM", "AVG", "COUNT", "MAX", "MIN", "DECIMAL",
      "CONCAT", "NOW", "DATE", "IFNULL", "NULLIF"
    ]);

    // Regex to tokenize: captures strings, comments, numbers, words, and symbols
    const tokenRegex = /(".*?"|'.*?'|--.*|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\b\d+(?:\.\d+)?\b|\S)/g;
    const parts = sql.split(tokenRegex);

    return parts.map(token => {
      if (!token) return "";

      // Escape HTML entities in the token
      const escapedToken = token
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // 1. Strings
      if (token.startsWith("'") || token.startsWith('"')) {
        return `<span class="text-rose-500 dark:text-rose-400">${escapedToken}</span>`;
      }

      // 2. Comments
      if (token.startsWith("--")) {
        return `<span class="text-slate-500 dark:text-slate-500 italic">${escapedToken}</span>`;
      }

      // 3. Numbers
      if (/^\d+(?:\.\d+)?$/.test(token)) {
        return `<span class="text-emerald-500 dark:text-emerald-400">${escapedToken}</span>`;
      }

      // 4. Words (Keywords or Functions or Columns)
      const upperToken = token.toUpperCase();
      if (keywords.has(upperToken)) {
        return `<span class="text-blue-500 dark:text-sky-400 font-bold">${escapedToken}</span>`;
      }
      if (functions.has(upperToken)) {
        return `<span class="text-amber-500 dark:text-amber-400 font-medium">${escapedToken}</span>`;
      }

      // 5. Default/Symbols
      return escapedToken;
    }).join("");
  };

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatLine = (text) => {
    if (!text) return "";
    // AI and database content is treated as text before adding our small,
    // controlled set of formatting tags.
    let processed = escapeHtml(text);
    // 1. Parse bold text (**text** -> <strong>text</strong>)
    processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // 2. Parse italic/emphasized text (*text* -> <em>text</em>)
    processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // 3. Parse inline code (`code` -> <code>code</code>)
    processed = processed.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-xs text-blue-600 dark:text-blue-400'>$1</code>");
    // 4. Parse safe web links.
    processed = processed.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="font-medium text-primary underline underline-offset-2">$1</a>'
    );
    // 5. Strip unbalanced single asterisks
    processed = processed.replace(/\*/g, "");
    return processed;
  };

  // ── Format message content ──────────────────────────────────────────
  const parseTable = (tableLines) => {
    if (tableLines.length < 2) return null;

    const headerLine = tableLines[0];
    const separatorLine = tableLines[1];

    // Check if second line is a valid separator line (contains hyphens, pipes, colons)
    if (!/^[|\s:-]+$/.test(separatorLine)) return null;

    const parseRow = (line) => {
      // Split by '|', trim, and remove empty first/last elements
      const parts = line.split('|').map(p => p.trim());
      if (line.startsWith('|')) parts.shift();
      if (line.endsWith('|')) parts.pop();
      return parts;
    };

    const headers = parseRow(headerLine);
    const rows = tableLines.slice(2).map(parseRow).filter(row => row.length > 0 && row.some(cell => cell !== ""));

    return { headers, rows };
  };

  const renderSingleLine = (line, key) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={key} className="h-2" />;

    // Horizontal separator
    if (trimmed === "--" || trimmed === "---") {
      return <hr key={key} className="my-4 border-t border-border/40 dark:border-white/5" />;
    }

    // Check for headers first
    if (trimmed.startsWith("### ")) {
      const hContent = formatLine(trimmed.slice(4));
      return (
        <h3 key={key} className="text-base font-bold mt-4 mb-2 text-foreground flex items-center gap-2" dangerouslySetInnerHTML={{ __html: hContent }} />
      );
    }
    if (trimmed.startsWith("## ")) {
      const hContent = formatLine(trimmed.slice(3));
      return (
        <h2 key={key} className="text-lg font-bold mt-5 mb-2.5 text-foreground flex items-center gap-2" dangerouslySetInnerHTML={{ __html: hContent }} />
      );
    }
    if (trimmed.startsWith("# ")) {
      const hContent = formatLine(trimmed.slice(2));
      return (
        <h1 key={key} className="text-xl font-bold mt-6 mb-3 text-foreground flex items-center gap-2" dangerouslySetInnerHTML={{ __html: hContent }} />
      );
    }

    // Check Emoji Card Match on raw line
    const emojiCardMatch = line.match(/^(?:\s*[-*•+]\s*)?(?:\s*\d+\.\s*)?([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*([^:]+):\s*(.+)$/);
    if (emojiCardMatch) {
      const emoji = emojiCardMatch[1];
      const title = formatLine(emojiCardMatch[2]);
      const desc = formatLine(emojiCardMatch[3]);
      return (
        <div key={key} className="my-3.5 p-4 bg-black/[0.02] dark:bg-white/[0.015] border border-border/40 dark:border-white/5 border-l-4 border-l-blue-500/80 rounded-xl rounded-l-none flex items-start gap-3.5 shadow-sm hover:border-l-blue-500 transition-all duration-300">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center text-lg shrink-0 border border-blue-500/15">
            {emoji}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-foreground text-sm tracking-wide" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-sm text-foreground/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
          </div>
        </div>
      );
    }

    // Check for bullet points on raw line
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ") || trimmed.startsWith("+ ")) {
      const itemContent = formatLine(trimmed.slice(2));
      const isNested = line.startsWith("  ") || line.startsWith("    ") || line.startsWith("\t");
      return (
        <div key={key} className={`flex items-start gap-2.5 my-1.5 ${isNested ? "pl-8" : "pl-3"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 mt-2 shrink-0" />
          <p className="text-sm text-foreground/90 leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: itemContent }} />
        </div>
      );
    }

    // Check for numbered lists
    const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const text = formatLine(numberedMatch[2]);
      return (
        <div key={key} className="flex items-start gap-2.5 my-1.5 pl-3">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 font-mono text-[10px] font-bold mt-0.5 shrink-0 border border-blue-500/20">
            {num}
          </span>
          <p className="text-sm text-foreground/90 leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      );
    }

    // Default paragraph
    const processedLine = formatLine(line);
    return (
      <p key={key} className="mb-3 text-foreground/90 leading-relaxed text-[15px]" dangerouslySetInnerHTML={{ __html: processedLine }} />
    );
  };

  const formatContent = (content) => {
    if (!content) return null;
    const lines = content.split("\n");
    const blocks = [];
    let currentTable = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // If the line starts with '|' and ends with '|' (or at least starts with '|' and contains '|'), it's a table line
      if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
        currentTable.push(line);
      } else {
        if (currentTable.length > 0) {
          blocks.push({ type: "table", lines: currentTable });
          currentTable = [];
        }
        blocks.push({ type: "line", content: line, index: i });
      }
    }

    if (currentTable.length > 0) {
      blocks.push({ type: "table", lines: currentTable });
    }

    return blocks.map((block, idx) => {
      if (block.type === "table") {
        const parsed = parseTable(block.lines);
        if (parsed) {
          const { headers, rows } = parsed;
          return (
            <div key={`table-${idx}`} className="my-4 overflow-x-auto rounded-xl border border-border/60 bg-card/45 shadow-sm">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]"
                        dangerouslySetInnerHTML={{ __html: formatLine(h) }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-3 text-foreground/90 font-medium text-[13px]"
                          dangerouslySetInnerHTML={{ __html: formatLine(cell) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else {
          return block.lines.map((line, lIdx) => renderSingleLine(line, `table-fallback-${idx}-${lIdx}`));
        }
      } else {
        return renderSingleLine(block.content, `line-${block.index}`);
      }
    });
  };

  const formatMessageTimestamp = (isoStr) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return format(d, "PP, p");
    } catch {
      return "";
    }
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="workspace-canvas relative flex h-full w-full flex-1 flex-col items-center overflow-hidden">
        {/* Active data source & New Chat button */}
        <div className="absolute left-1/2 top-3 z-20 max-w-[95vw] -translate-x-1/2 flex items-center justify-between gap-3 w-full max-w-5xl px-4 pointer-events-none">
          {activeConn ? (
            <StatusPill tone="success" className="max-w-full bg-card/90 shadow-sm backdrop-blur-xl pointer-events-auto">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <Database className="h-3.5 w-3.5" />
              <span className="truncate">{activeConn.name}</span>
              {activeConn.tables > 0 ? <span className="hidden opacity-65 sm:inline">· {activeConn.tables} tables</span> : null}
            </StatusPill>
          ) : <div />}

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('repnex-new-chat'));
            }}
            className="group pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 brand-gradient text-white font-semibold text-xs rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white group-hover:rotate-90 transition-transform duration-300" />
            <span>New Chat</span>
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleConversationScroll}
          className="custom-scrollbar flex w-full flex-1 flex-col overflow-y-auto pb-44 pt-16"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
            {loadingHistory ? (
              <div className="flex-1 flex flex-col gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex w-full ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    {i % 2 === 0 && (
                      <div className="w-9 h-9 rounded-full bg-muted shrink-0 mr-3" />
                    )}
                    <div className={`flex flex-col ${i % 2 === 0 ? "items-start" : "items-end"} max-w-[70%] w-full gap-2`}>
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-12 bg-muted rounded-2xl w-full animate-pulse" />
                    </div>
                    {i % 2 !== 0 && (
                      <div className="w-9 h-9 rounded-full bg-muted shrink-0 ml-3" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  layout
                  id={`message-${msg.id}`}
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-7 flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <ProductMark className="mr-3 h-9 w-9 shrink-0 rounded-xl" />
                  )}

                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} ${msg.role === "ai" && (msg.type === "executable" || msg.sql || msg.type === "template_preview")
                      ? "w-full max-w-full"
                      : "max-w-[88%] sm:max-w-[82%]"
                    }`}>
                    {/* Render content box for: user messages, errors, ai messages with content, or executable ai messages (so insight shows when it arrives) */}
                    {(msg.content || msg.type === "error" || msg.role === "user" || (msg.role === "ai" && (msg.type === "executable" || !!msg.sql))) && (
                      <div
                        className={`relative group ${msg.role === "user"
                            ? "brand-gradient rounded-2xl rounded-tr-md px-4 py-3 pr-11 text-white shadow-md shadow-primary/15 sm:px-5 sm:pr-11"
                            : msg.type === "error"
                              ? "w-full rounded-2xl rounded-tl-md border border-red-200/70 bg-red-50/85 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/25 sm:p-5"
                              : (msg.type === "executable" || msg.sql || msg.type === "template_preview")
                                ? "app-card w-full rounded-2xl rounded-tl-md p-4 sm:p-5"
                                : "app-card rounded-2xl rounded-tl-md p-4 sm:p-5"
                          }`}
                      >
                        {/* Keep the disclosure only for responses that are genuinely long. */}
                        {msg.role === "ai" && isMessageCollapsible(msg) && (
                          <div className="mb-3 flex select-none items-center justify-between gap-3 border-b border-border/50 pb-3">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Response
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSummaryCollapse(msg)}
                              aria-expanded={!isSummaryCollapsed(msg)}
                              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/8"
                            >
                              {isSummaryCollapsed(msg) ? (
                                <>
                                  <span>Show response</span>
                                  <ChevronDown className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  <span>Hide response</span>
                                  <ChevronUp className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {msg.role === "user" ? (
                          editingMessageId === msg.id ? (
                            <div className="flex w-[min(70vw,520px)] min-w-0 flex-col gap-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-blue-700 text-white rounded-lg p-2 border border-blue-500 focus:outline-none resize-none text-[15px]"
                                rows={2}
                              />
                              <p className="text-[11px] leading-4 text-blue-100/85">
                                Editing this question will replace the replies below it.
                              </p>
                              <div className="flex justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-blue-200 rounded-md transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditSave(msg.id)}
                                  className="px-3 py-1.5 bg-white text-blue-600 font-semibold hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  Save and resend
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[15px] leading-relaxed">{msg.content}</span>
                          )
                        ) : (
                          /* AI message block */
                          <div className="overflow-hidden">
                            <AnimatePresence initial={false} mode="wait">
                              {isSummaryCollapsed(msg) ? (
                                <motion.div
                                  key="collapsed"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                  className="text-xs text-muted-foreground italic flex items-center justify-between gap-4"
                                >
                                  <span>
                                    {msg.type === "error"
                                      ? "Error: Click expand to view details"
                                      : msg.content
                                        ? `${msg.content.slice(0, 100).replace(/[#*`_-]/g, '')}...`
                                        : "Click expand to view details"
                                    }
                                  </span>
                                  {msg.rowsReturned != null && (
                                    <span className="shrink-0 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/15">
                                      {msg.rowsReturned} rows
                                    </span>
                                  )}
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="expanded"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                  className="text-[15px] leading-relaxed text-foreground"
                                >
                                  {msg.type === "error" && (
                                    <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-xs font-semibold uppercase">Could not process</span>
                                    </div>
                                  )}
                                  {msg.isStreaming && !msg.content ? (
                                    /* Insight generating skeleton */
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
                                      <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                      </div>
                                      <span className="text-xs text-muted-foreground">Generating insights...</span>
                                    </div>
                                  ) : (
                                    formatContent(
                                      msg.content ||
                                      (msg.type === "executable" || msg.sql
                                        ? `Data query completed. Retrieved ${msg.rowsReturned ?? (msg.rows ? msg.rows.length : 0)} records.`
                                        : "")
                                    )
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Edit button for user message */}
                        {msg.role === "user" && editingMessageId !== msg.id && (
                          <button
                            onClick={() => handleEditStart(msg)}
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-white/80 opacity-100 transition-all hover:bg-white/15 hover:text-white sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
                            title="Edit question"
                            aria-label="Edit question"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* SQL display */}
                    <AnimatePresence>
                      {msg.sql && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="mt-4 w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:bg-slate-950"
                        >
                          {/* Code block header */}
                          <div className="flex select-none items-center justify-between border-b border-border/70 bg-muted/60 px-4 py-2.5 text-foreground dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
                                SQL
                              </span>
                              <span className="font-sans text-xs font-semibold text-foreground dark:text-slate-100">
                                Query Execution
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isSqlCollapsed(msg.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.sql, `sql-${msg.id}`)}
                                  className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-2 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/12 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                  aria-label="Copy SQL query"
                                >
                                  {copiedId === `sql-${msg.id}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-emerald-500 font-medium">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleSqlCollapse(msg.id)}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/8 dark:text-sky-300 dark:hover:bg-white/5"
                                aria-expanded={!isSqlCollapsed(msg.id)}
                                aria-controls={`sql-${msg.id}`}
                              >
                                {isSqlCollapsed(msg.id) ? (
                                  <>
                                    <span>Expand SQL</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Collapse SQL</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          {/* Highlighted SQL pre code */}
                          <AnimatePresence initial={false}>
                            {!isSqlCollapsed(msg.id) && (
                              <motion.pre
                                id={`sql-${msg.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="custom-scrollbar select-all overflow-x-auto bg-card p-4 font-mono text-xs font-semibold leading-relaxed text-slate-800 outline-none dark:bg-slate-950 dark:text-slate-300 sm:text-[13px]"
                                dangerouslySetInnerHTML={{ __html: highlightSQL(msg.sql) }}
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Execution stats */}
                    {(msg.type === "executable" || msg.sql || msg.type === "template_preview") ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {msg.rowsReturned != null && (
                          <span className="flex items-center gap-1">
                            <Rows3 className="w-3.5 h-3.5 text-slate-400" />
                            {msg.rowsReturned.toLocaleString()} rows
                          </span>
                        )}
                        {msg.executionTime != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {msg.executionTime}ms
                          </span>
                        )}
                        {msg.timestamp && (
                          <span className="flex items-center gap-1 text-[11px] opacity-80 font-sans">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatMessageTimestamp(msg.timestamp)}
                          </span>
                        )}
                      </div>
                    ) : (
                      msg.timestamp && (
                        <div className="mt-1 text-[10px] text-muted-foreground/75 px-1 font-sans">
                          {formatMessageTimestamp(msg.timestamp)}
                        </div>
                      )
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
                    {((msg.showReportBtn && (msg.type === "executable" || !!msg.sql)) || (msg.type === "executable" && !!msg.sql && (msg.rowsReturned > 0 || (msg.rows && msg.rows.length > 0)))) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2"
                      >
                        <button
                          onClick={() => {
                            const reportData = {
                              rows: msg.rows,
                              columns: msg.columns,
                              sql: msg.sql,
                              templateId: msg.templateId,
                              extractedParams: msg.extractedParams,
                              summary: msg.summary || msg.content || '',
                              col_meta: msg.colMeta || null,   // ← axis hints from backend
                            };
                            const reportQuery = msg.templateDescription || initialQuery;
                            if (isProcessing) {
                              // WS is active — open as popup to avoid killing the connection
                              setPreviewReport({ query: reportQuery, data: reportData });
                              setShowReportPreview(true);
                            } else {
                              onOpenReport(reportQuery, reportData);
                            }
                          }}
                          className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-primary/15 bg-primary/8 px-5 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/12"
                        >
                          <Sparkles className="w-5 h-5 text-foreground/70 transition-transform group-hover:rotate-12 group-hover:text-primary" />
                          <span>Open interactive report</span>
                          {isProcessing && (
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">(preview)</span>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {/* A consistent action row works on desktop, touch and keyboard. */}
                    {msg.role === "ai" && msg.content && (
                      <div className="mt-3 flex w-full flex-col gap-2 border-t border-border/30 pt-2.5 dark:border-white/5">
                        <div className="flex min-h-8 flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Copy response"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                          </button>

                          {msg.type === "error" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRetryResponse(msg.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Try again
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditPreviousQuestion(msg.id)}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit question
                              </button>
                            </>
                          )}

                          {msg.historyId && !feedbacks[msg.id] && (
                            <>
                              <span className="mx-1 h-4 w-px bg-border/70" aria-hidden="true" />
                              <span className="sr-only">Was this response helpful?</span>
                              <button
                                type="button"
                                onClick={() => handleFeedbackSubmit(msg.id, msg.historyId, true)}
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Helpful"
                                aria-label="Mark response as helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedbackNegativeClick(msg.id)}
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Not helpful"
                                aria-label="Mark response as not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {feedbacks[msg.id]?.submitted && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="ml-1 flex items-center gap-1.5 font-medium text-emerald-500"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Feedback received
                            </motion.span>
                          )}
                        </div>

                        {msg.historyId && feedbacks[msg.id] && !feedbacks[msg.id].submitted && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex flex-col gap-3 p-3 bg-black/[0.02] dark:bg-black/20 border border-border/40 dark:border-white/5 rounded-xl w-full max-w-md mt-1"
                          >
                            <div className="text-xs font-semibold text-foreground">Why wasn't it helpful?</div>

                            {/* Category selection */}
                            <div className="flex flex-wrap gap-1.5">
                              {["Wrong Output", "Didn't understand", "Slow", "Other"].map((cat) => {
                                const isSelected = feedbacks[msg.id].category === cat;
                                return (
                                  <button
                                    key={cat}
                                    onClick={() => handleFeedbackCategoryChange(msg.id, cat)}
                                    className={`px-2.5 py-1 rounded-full text-xs transition-all border ${isSelected
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/35 text-muted-foreground hover:text-foreground border-border/50 dark:border-white/5"
                                      }`}
                                  >
                                    {cat}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Text feedback comment */}
                            <textarea
                              placeholder="Describe the issue or how we can improve..."
                              value={feedbacks[msg.id].comment || ""}
                              onChange={(e) => handleFeedbackCommentChange(msg.id, e.target.value)}
                              className="w-full bg-white dark:bg-black/25 border border-border/60 dark:border-white/5 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground resize-none"
                              rows={2}
                            />

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 text-[11px]">
                              <button
                                onClick={() => handleFeedbackCancel(msg.id)}
                                className="px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleFeedbackNegativeSubmit(msg.id, msg.historyId)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                              >
                                Submit Feedback
                              </button>
                            </div>
                          </motion.div>
                        )}

                      </div>
                    )}
                  </div>

                </motion.div>
              )))}

            {/* One stable status card avoids a jump between separate loaders. */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full mb-6 justify-start"
                role="status"
                aria-live="polite"
              >
                <ProductMark className="mr-3 h-9 w-9 shrink-0 rounded-xl" />
                <PipelineStatus
                  currentStep={pipelineStep || "classify"}
                  completedSteps={completedSteps}
                  statusText={currentStatusText || "Understanding your question"}
                />
              </motion.div>
            )}



            {/* Follow-up suggestions */}
            <AnimatePresence>
              {showSuggestions && !isProcessing && currentSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="custom-scrollbar mb-7 flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-2 pl-12 sm:flex-wrap sm:overflow-visible sm:pb-0"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Suggestions:</span>
                  </div>
                  {currentSuggestions.map((sug) => (
                    <button
                      key={typeof sug === "string" ? sug : sug.text || String(sug)}
                      disabled={isViewer}
                      onClick={async () => {
                        if (isViewer) return;
                        setShowSuggestions(false);
                        const sugText = typeof sug === "string" ? sug : sug.text || sug;
                        if (sugText === "Contact your admin to request module access") {
                          const lastMsg = [...messages].reverse().find(m => m.templateModule);
                          if (lastMsg && lastMsg.templateModule) {
                            try {
                              await organizationApi.requestPermission(lastMsg.templateModule);
                              setMessages(prev => [
                                ...prev,
                                {
                                  id: Date.now().toString(),
                                  role: "ai",
                                  type: "conversational",
                                  content: `Request submitted! A permission request for the **${lastMsg.templateModule.toUpperCase()}** module has been sent to your administrators.`,
                                }
                              ]);
                              addNotification("success", "Permission request sent to administrators.");
                            } catch (err) {
                              addNotification("error", err.message || "Failed to submit request.");
                            }
                          } else {
                            addNotification("error", "No module information found for request.");
                          }
                        } else {
                          processQuery(sugText);
                        }
                      }}
                      className={`app-card max-w-[280px] shrink-0 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary ${isViewer ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {typeof sug === "string" ? sug : sug.text || sug}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} className="h-4 w-full shrink-0 block" />
          </div>
        </div>

        <AnimatePresence>
          {showScrollToLatest && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              onClick={() => scrollToLatest("smooth")}
              className="app-card absolute bottom-[142px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-foreground shadow-lg"
              aria-label="Jump to the latest message"
            >
              <ArrowDown className="h-3.5 w-3.5 text-primary" />
              Latest message
            </motion.button>
          )}
        </AnimatePresence>

        {/* Fixed Bottom Input */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex w-full justify-center bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-10 sm:px-6">
          <div className="pointer-events-auto w-full max-w-5xl">
            <form
              onSubmit={handleSubmit}
              className="prompt-shell flex min-h-[96px] w-full flex-col rounded-[22px] p-2"
              data-processing={isProcessing ? "true" : "false"}
            >
              <textarea
                ref={composerRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isViewer ? "Chat is unavailable for viewer accounts" : "Ask a follow-up question..."}
                disabled={isViewer}
                className="chat-composer-input min-h-[46px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent p-3 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/65"
                onKeyDown={(e) => {
                  if (isViewer) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="mt-auto flex items-center justify-between gap-3 px-2 py-1">
                <div className="flex min-w-0 items-center gap-2">
                  <ModelProviderMenu />
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">Enter to send · Shift + Enter for a new line</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isSpeechSupported ? (
                    <button
                      type="button"
                      disabled={isViewer}
                      onClick={toggleListening}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${isListening
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } disabled:opacity-30`}
                      title={isListening ? "Stop listening" : "Start voice typing"}
                      aria-label={isListening ? "Stop listening" : "Start voice typing"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl text-muted-foreground/30"
                      title="Speech recognition is not supported in this browser"
                      aria-label="Voice input unavailable"
                    >
                      <MicOff className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type={isProcessing ? "button" : "submit"}
                    onClick={isProcessing ? handleCancel : undefined}
                    disabled={isViewer || (!inputValue.trim() && !isProcessing)}
                    className={`group flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-all ${isProcessing
                        ? "bg-slate-700 shadow-slate-700/20 hover:bg-slate-800"
                        : "brand-gradient shadow-primary/25 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30 disabled:shadow-none"
                      }`}
                    aria-label={isProcessing ? "Stop response" : "Send question"}
                  >
                    {isProcessing ? (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <ArrowUp className="h-4 w-4 stroke-[2.5px] transition-transform group-active:-translate-y-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
              Review important results before sharing them.
            </p>
          </div>
        </div>
      </div>

      {/* Accessible focus-trapped report preview. ReportBuilder provides the visible close button. */}
      <Sheet open={showReportPreview} onOpenChange={setShowReportPreview}>
        {previewReport && (
          <SheetContent
            side="right"
            className="flex h-full w-full max-w-5xl flex-col border-l border-border/70 p-0 sm:max-w-5xl [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Interactive report preview</SheetTitle>
            <SheetDescription className="sr-only">
              Preview the report without leaving the current chat.
            </SheetDescription>
            <div className="flex flex-1 flex-col overflow-hidden">
              <ReportBuilder
                query={previewReport.query}
                reportData={previewReport.data}
                onClose={() => setShowReportPreview(false)}
                isPreview={true}
              />
            </div>
          </SheetContent>
        )}
      </Sheet>
    </>
  );
}
