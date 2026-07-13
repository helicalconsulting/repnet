import { motion, AnimatePresence } from "framer-motion";
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  ArrowUp, Sparkles, Bot, User, Copy, Check, Loader2,
  Database, Code, Lightbulb, AlertCircle, Clock, Rows3, ChevronDown, ChevronUp,
  Edit2, Pause, Play, Square, Paperclip, ThumbsUp, ThumbsDown, Mic, MicOff
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { usePersonalization } from "../context/PersonalizationContext";
import { queryApi, sessionsApi, organizationApi, getToken } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import ParameterCard from "./ParameterCard";
import PipelineStatus from "./PipelineStatus";
import { QuickVisuals } from "./chat/QuickVisuals";

export default function ChatConversation({ initialQuery, onOpenReport, sessionId, onSessionCreated }) {
  const { connections, activeConnection, addNotification, user } = useApp();
  const { getCasualResponse, profile } = usePersonalization();
  const navigate = useNavigate();
  const location = useLocation();
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
  const loadedSessionIdRef = useRef(null);
  const hasProcessedInitialRef = useRef(false);
  const [requestedModules, setRequestedModules] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef(null);
  const socketSessionIdRef = useRef(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [collapsedMessages, setCollapsedMessages] = useState({});
  const [expandedVisuals, setExpandedVisuals] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

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

  const toggleCollapse = (id) => {
    setCollapsedMessages(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  const isMessageCollapsed = (id) => {
    return collapsedMessages[id] !== false;
  };


  const toggleVisuals = (msgId) => {
    setExpandedVisuals((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
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
      [msgId]: { ...prev[msgId], [msgId]: true, submitted: false, isPositive: false, category: "Wrong SQL", comment: "" },
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

  const activeConn = connections.find((c) => c.id === activeConnection);
  const { isDark } = useTheme();
  const isViewer = user?.role === 'viewer';

  const getWsServerUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE || 'https://repnex-production.up.railway.app/v1';
    let wsBase = apiBase.replace(/\/v1\/?$/, '');
    wsBase = wsBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return wsBase;
  };

  const handlePause = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "pause" }));
      setIsPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "resume" }));
      setIsPaused(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "cancel" }));
      socketRef.current.close();
    }
    setIsProcessing(false);
    setPipelineStep(null);
    setCurrentStatusText("");
  }, []);

  // ── Process a user query ────────────────────────────────────────────
  const processQuery = useCallback(
    async (query) => {
      if (isViewer) return;
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
        const userMsg = { id: `user-${Date.now()}`, role: "user", content: query };
        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: "ai",
          type: "conversational",
          content: casualResponse,
        };
        setMessages((prev) => [...prev, userMsg, aiMsg]);
        setIsProcessing(false);
        return;
      }

      setPipelineStep("classify");
      setCompletedSteps([]);
      setCurrentStatusText("Classifying intent");

      // Add user message
      const userMsgId = `user-${Date.now()}`;
      const userMsg = { id: userMsgId, role: "user", content: query };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const isValidUuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
        let activeSessionId = (sessionId && isValidUuid(sessionId)) ? sessionId : null;

        if (!activeSessionId) {
          try {
            const newSession = await sessionsApi.create({
              title: query.slice(0, 60) || "New chat",
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
          // WebSocket execution path (for live streaming, pausing, resuming, cancelling)
          setIsPaused(false);
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
              } catch (e) {}
              
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
                setPipelineStep("classify");
                setCompletedSteps([]);
                setCurrentStatusText("Classifying intent");
              } else if (event.step === "sql_build") {
                setPipelineStep("extract");
                setCompletedSteps(["classify", "search"]);
                setCurrentStatusText("Building query");
              } else if (event.step === "execute") {
                setPipelineStep("execute");
                setCompletedSteps(["classify", "search", "extract"]);
                setCurrentStatusText("Executing query");
              } else if (event.step === "insight") {
                setPipelineStep("insight");
                setCompletedSteps(["classify", "search", "extract", "execute"]);
                setCurrentStatusText("Generating insights");
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
                const updatedFields = {
                  isStreaming: false,
                  showReportBtn: true,
                  rowsReturned: event.rows_returned,
                  executionTime: event.exec_time_ms,
                  historyId: event.history_id,
                  suggestions: backendSugs,
                };
                if (exists) {
                  return prev.map((m) => {
                    if (m.id === aiMsgId) {
                      return { ...m, ...updatedFields, columns: event.columns || m.columns };
                    }
                    return m;
                  });
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
                      columns: event.columns,
                      rowsReturned: event.rows_returned,
                      executionTime: event.exec_time_ms,
                      isStreaming: false,
                      showReportBtn: true,
                      historyId: event.history_id,
                      suggestions: backendSugs,
                    },
                  ];
                }
              });
              setCurrentSuggestions(backendSugs);
              setShowSuggestions(backendSugs.length > 0);
              ws.close();
              setIsProcessing(false);
              setPipelineStep(null);
              setCurrentStatusText("");
              window.dispatchEvent(new Event("repnex-sessions-updated"));
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
          await new Promise((r) => setTimeout(r, 400));
          setCompletedSteps(["classify"]);
          setPipelineStep("search");

          await new Promise((r) => setTimeout(r, 300));
          setCompletedSteps(["classify", "search"]);
          setPipelineStep("extract");

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

          setCompletedSteps(["classify", "search", "extract"]);

          if (response.type === "conversational") {
            // Conversational response
            setPipelineStep(null);
            const backendSugs = getCombinedSuggestions(response);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                type: "conversational",
                content: response.message,
                suggestions: backendSugs,
              },
            ]);
            setCurrentSuggestions(backendSugs);
            setShowSuggestions(backendSugs.length > 0);

          } else if (response.type === "params_needed") {
            // Need user input for params
            setPipelineStep(null);
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
              },
            ]);
            setCurrentSuggestions(backendSugs);
            setShowSuggestions(backendSugs.length > 0);

          } else if (response.type === "executable") {
            // Query executed successfully
            setPipelineStep("execute");
            await new Promise((r) => setTimeout(r, 300));
            setCompletedSteps(["classify", "search", "extract", "execute"]);
            setPipelineStep("insight");
            await new Promise((r) => setTimeout(r, 200));
            setCompletedSteps(["classify", "search", "extract", "execute", "insight"]);
            setPipelineStep(null);

            const backendSugs = getCombinedSuggestions(response);
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
                templateDescription: response.template_description,
                extractedParams: response.extracted_params || {},
                showReportBtn: true,
                historyId: response.history_id,
                suggestions: backendSugs,
              },
            ]);
            setCurrentSuggestions(backendSugs);
            setShowSuggestions(backendSugs.length > 0);

          } else if (response.type === "template_preview") {
            // No DB connected - show template preview + SQL
            setPipelineStep(null);
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
            setShowSuggestions(backendSugs.length > 0);

          } else if (response.type === "access_denied") {
            setPipelineStep(null);
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
            setShowSuggestions(backendSugs.length > 0);

          } else {
            // Error
            setPipelineStep(null);
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
            setShowSuggestions(backendSugs.length > 0);
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
    [activeConnection, sessionId, addNotification, profile]
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
      if (currentSessionId) {
        await sessionsApi.editTurn(currentSessionId, msgIdx);
      }
      setMessages((prev) => prev.slice(0, msgIdx));
      await processQuery(textToSubmit);
    } catch (err) {
      console.error("Failed to edit turn:", err);
      addNotification("error", "Failed to edit query: " + err.message);
      setIsProcessing(false);
    }
  }, [messages, currentSessionId, processQuery, addNotification, editingText]);

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
  }, [sessionId, addNotification]);

  // Process initial query on fresh mount (new chat from landing page)
  useEffect(() => {
    if (initialQuery && !sessionId && !hasProcessedInitialRef.current) {
      hasProcessedInitialRef.current = true;
      processQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pipelineStep, isProcessing]);

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
    [activeConnection, sessionId, addNotification]
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

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification("success", "Copied to clipboard");
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

  const formatLine = (text) => {
    if (!text) return "";
    let processed = text;
    // 1. Parse bold text (**text** -> <strong>text</strong>)
    processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // 2. Parse italic/emphasized text (*text* -> <em>text</em>)
    processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // 3. Parse inline code (`code` -> <code>code</code>)
    processed = processed.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-xs text-blue-600 dark:text-blue-400'>$1</code>");
    // 4. Strip unbalanced single asterisks
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

    // Check Text Card Match on raw line (Title: Description)
    const textCardMatch = line.match(/^(?:\s*[-*•+]\s*)?(?:\s*\d+\.\s*)?([^:]+):\s*(.+)$/);
    if (textCardMatch) {
      const rawTitle = textCardMatch[1].trim();
      const rawDesc = textCardMatch[2].trim();
      const cleanTitleLen = rawTitle.replace(/\*/g, "").length;
      if (cleanTitleLen > 0 && cleanTitleLen < 45 && rawDesc.length > 5) {
        const title = formatLine(rawTitle);
        const desc = formatLine(rawDesc);
        return (
          <div key={key} className="my-3 p-3.5 bg-black/[0.01] dark:bg-white/[0.01] border border-border/40 dark:border-white/5 border-l-2 border-l-blue-500 rounded-lg rounded-l-none flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 animate-pulse" />
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-foreground text-sm" dangerouslySetInnerHTML={{ __html: title }} />
              <p className="text-sm text-foreground/85 leading-relaxed" dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
          </div>
        );
      }
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

      <div className="w-full flex-1 flex flex-col pt-20 pb-40 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto px-6 flex-1 flex flex-col">
        <SmartSkeleton loading={loadingHistory}>
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

            <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} ${
              msg.role === "ai" && (msg.type === "executable" || msg.sql || msg.type === "template_preview") 
                ? "w-full max-w-full" 
                : "max-w-[85%]"
            }`}>
              {/* Only render message content container box if there is actual content, an error, or it's a user message */}
              {(msg.content || msg.type === "error" || msg.role === "user") && (
                <div
                  className={`relative group ${
                    msg.role === "user"
                      ? "px-5 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm"
                      : msg.type === "error"
                      ? "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 rounded-2xl rounded-tl-sm p-5 shadow-sm w-full"
                      : (msg.type === "executable" || msg.sql || msg.type === "template_preview")
                      ? "bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm w-full"
                      : "bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 rounded-2xl rounded-tl-sm p-5 shadow-sm"
                  }`}
                >
                  {/* Collapsible Header for AI messages */}
                  {msg.role === "ai" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30 dark:border-white/5 select-none">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {msg.type === "error" ? "Execution Error" : "AI Insights & Report Summary"}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleCollapse(msg.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        {isMessageCollapsed(msg.id) ? (
                          <>
                            <span>Expand Summary</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Collapse Summary</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.role === "user" ? (
                    editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 w-full min-w-[300px]">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-blue-700 text-white rounded-lg p-2 border border-blue-500 focus:outline-none resize-none text-[15px]"
                          rows={2}
                        />
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
                            Save & Submit
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
                        {isMessageCollapsed(msg.id) ? (
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
                            {formatContent(msg.content)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
 
                  {/* Copy button */}
                  {msg.role === "ai" && msg.content && !isMessageCollapsed(msg.id) && (
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
 
                  {/* Edit button for user message */}
                  {msg.role === "user" && editingMessageId !== msg.id && (
                    <button
                      onClick={() => handleEditStart(msg)}
                      className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-700 rounded-md transition-all text-blue-200"
                      title="Edit Query"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
 
              {/* SQL display */}
              <AnimatePresence>
                {!isMessageCollapsed(msg.id) && msg.sql && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="mt-4 w-full border border-border/40 dark:border-white/5 rounded-2xl overflow-hidden shadow-lg bg-[#0E121E]"
                  >
                    {/* Code block header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-border/30 dark:border-white/5 select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-sky-400 border border-blue-500/15">
                          SQL
                        </span>
                        <span className="text-xs text-slate-400 font-medium font-sans">
                          Query Execution
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(msg.sql, `sql-${msg.id}`)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 dark:hover:bg-white/5 text-xs text-slate-300 hover:text-white transition-all font-sans"
                      >
                        {copiedId === `sql-${msg.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* Highlighted SQL pre code */}
                    <pre 
                      className="p-4 text-slate-300 text-xs sm:text-[13px] overflow-x-auto font-mono leading-relaxed select-all custom-scrollbar outline-none"
                      dangerouslySetInnerHTML={{ __html: highlightSQL(msg.sql) }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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
              {(msg.showReportBtn || (msg.type === "executable" && !!msg.sql && msg.rowsReturned > 0)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4"
                >
                  <button
                    onClick={() => onOpenReport(msg.templateDescription || initialQuery, { 
                      rows: msg.rows, 
                      columns: msg.columns,
                      sql: msg.sql, 
                      templateId: msg.templateId, 
                      extractedParams: msg.extractedParams 
                    })}
                    className="flex items-center justify-center gap-3 w-full px-5 py-3.5 bg-muted/40 hover:bg-muted/70 dark:bg-white/5 dark:hover:bg-white/10 text-foreground border border-border/80 dark:border-white/10 rounded-xl transition-all shadow-sm group font-semibold text-sm select-none"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-foreground/70 group-hover:text-primary animate-pulse" />
                    <span>View Interactive Report with Data</span>
                  </button>
                </motion.div>
              )}

              {/* Feedback section */}
              {msg.role === "ai" && msg.historyId && (
                <div className="mt-4 pt-3 border-t border-border/30 dark:border-white/5 flex flex-col gap-2 w-full">
                  {!feedbacks[msg.id] && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Was this helpful?</span>
                      <button
                        onClick={() => handleFeedbackSubmit(msg.id, msg.historyId, true)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-muted-foreground hover:text-foreground"
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedbackNegativeClick(msg.id)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-muted-foreground hover:text-foreground"
                        title="Not Helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {feedbacks[msg.id] && !feedbacks[msg.id].submitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex flex-col gap-3 p-3 bg-black/[0.02] dark:bg-black/20 border border-border/40 dark:border-white/5 rounded-xl w-full max-w-md mt-1"
                    >
                      <div className="text-xs font-semibold text-foreground">Why wasn't it helpful?</div>
                      
                      {/* Category selection */}
                      <div className="flex flex-wrap gap-1.5">
                        {["Wrong SQL", "Didn't understand", "Slow", "Other"].map((cat) => {
                          const isSelected = feedbacks[msg.id].category === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => handleFeedbackCategoryChange(msg.id, cat)}
                              className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
                                isSelected
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

                  {feedbacks[msg.id] && feedbacks[msg.id].submitted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium mt-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Thank you for your feedback!</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center ml-3 shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        )))}
        </SmartSkeleton>

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
            <PipelineStatus currentStep={pipelineStep} completedSteps={completedSteps} statusText={currentStatusText} />
          </motion.div>
        )}

        {/* Typing indicator (no pipeline yet) */}
        {isProcessing && !pipelineStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full mb-6 justify-start"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center mr-3 shrink-0 shadow shadow-blue-500/10">
              <Bot className="w-4 h-4 text-blue-700" />
            </div>
            <SmartSkeleton loading={true}>
              <div className="flex flex-col gap-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/5 p-5 rounded-2xl rounded-tl-sm w-72 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </SmartSkeleton>
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
                  className={`px-3 py-1.5 text-xs font-medium bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 hover:border-primary/50 rounded-lg transition-colors ${isViewer ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Fixed Bottom Input */}
      <div className="absolute bottom-0 w-full left-0 right-0 px-6 pb-6 bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9]/95 dark:from-[#141414] dark:via-[#141414]/95 to-transparent z-10 pt-10 flex justify-center pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-6xl pointer-events-auto bg-card dark:bg-[#1C1C1C] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-border/50 dark:border-white/5 flex flex-col p-2 min-h-[90px] focus-within:border-primary/30 focus-within:shadow-[0_8px_30px_rgba(37,99,235,0.15)] transition-all"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isViewer ? "Viewer role: Chat input is disabled" : "Ask a follow-up question..."}
            disabled={isViewer}
            className="w-full bg-transparent border-none outline-none text-foreground text-[15px] p-3 resize-none placeholder:text-muted-foreground/60 min-h-[44px] max-h-[200px] overflow-y-auto"
            onKeyDown={(e) => {
              if (isViewer) return;
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
                disabled={isViewer}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              {isSpeechSupported ? (
                <button
                  type="button"
                  disabled={isViewer}
                  onClick={toggleListening}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all relative ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                  } disabled:opacity-30`}
                  title={isListening ? "Stop listening" : "Start voice typing"}
                >
                  {isListening ? (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                      <Mic className="w-4 h-4 z-10" />
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={true}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground/30 rounded-full cursor-not-allowed"
                  title="Speech recognition not supported in this browser"
                >
                  <MicOff className="w-4 h-4" />
                </button>
              )}
              <button
                type={isProcessing ? "button" : "submit"}
                onClick={isProcessing ? handleCancel : undefined}
                disabled={isViewer || (!inputValue.trim() && !isProcessing)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-lg group ${
                  isProcessing 
                    ? "bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-700 dark:hover:bg-neutral-300 text-neutral-100 dark:text-neutral-900 shadow-sm" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30 disabled:opacity-30 disabled:bg-muted-foreground disabled:shadow-none"
                }`}
              >
                {isProcessing ? (
                  <Pause className="w-4 h-4 text-current fill-current" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[3px] group-active:translate-y-[-2px] transition-transform" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
