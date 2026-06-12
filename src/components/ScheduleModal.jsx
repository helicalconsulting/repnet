import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Calendar,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Zap,
} from "lucide-react";
import { reportApi, databaseApi } from "../services/api";

// ── Interval option definitions ───────────────────────────────────────────────
const INTERVAL_OPTIONS = [
  {
    value: 0,
    label: "Manual Only",
    desc: "Refresh only when you click the button",
    icon: "🖱️",
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    activeBg: "bg-muted/80",
    activeBorder: "border-foreground/30",
  },
  {
    value: 1,
    label: "Daily",
    desc: "Auto-refresh every 24 hours",
    icon: "⚡",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    activeBg: "bg-amber-500/15",
    activeBorder: "border-amber-500",
  },
  {
    value: 2,
    label: "Every 2 Days",
    desc: "Auto-refresh every 48 hours",
    icon: "📅",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    activeBg: "bg-blue-500/15",
    activeBorder: "border-blue-500",
  },
  {
    value: 3,
    label: "Every 3 Days",
    desc: "Auto-refresh every 72 hours",
    icon: "🗓️",
    color: "text-violet-500",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    activeBg: "bg-violet-500/15",
    activeBorder: "border-violet-500",
  },
];

function fmtDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  const hrs = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (days > 0) return diff > 0 ? `in ${days}d` : `${days}d ago`;
  if (hrs > 0) return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`;
  return diff > 0 ? `in ${mins}m` : `${mins}m ago`;
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ScheduleModal({ report, onClose, onSaved }) {
  const [intervalDays, setIntervalDays] = useState(report?.refresh_interval_days ?? 0);
  const [connectionId, setConnectionId] = useState(report?.auto_refresh_connection_id ?? "");
  const [connections, setConnections] = useState([]);
  const [loadingConns, setLoadingConns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "success" | "error"
  const [connDropOpen, setConnDropOpen] = useState(false);

  // Load connections
  useEffect(() => {
    databaseApi.getConnections().then((data) => {
      setConnections(data || []);
      setLoadingConns(false);
    }).catch(() => setLoadingConns(false));
  }, []);

  const selectedConn = connections.find((c) => c.id === connectionId);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const updated = await reportApi.setSchedule(report.id, {
        intervalDays: intervalDays || null,
        connectionId: connectionId || null,
      });
      setSaveStatus("success");
      onSaved?.(updated);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Compute next refresh preview
  const nextPreview =
    intervalDays > 0 && connectionId
      ? new Date(Date.now() + intervalDays * 86400000)
      : null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-violet-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Schedule Auto-Refresh</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {report?.name || "Report"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">

            {/* Interval selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Refresh Interval
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INTERVAL_OPTIONS.map((opt) => {
                  const isActive = intervalDays === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setIntervalDays(opt.value)}
                      className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                        isActive
                          ? `${opt.activeBg} ${opt.activeBorder}`
                          : `${opt.bg} ${opt.border} hover:bg-muted/60`
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{opt.icon}</span>
                        <span className={`text-sm font-semibold ${isActive ? opt.color : "text-foreground"}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {opt.desc}
                      </p>
                      {isActive && (
                        <motion.div
                          layoutId="interval-check"
                          className="absolute top-2 right-2"
                        >
                          <CheckCircle2 className={`w-4 h-4 ${opt.color}`} />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connection selector — only shown if interval > 0 */}
            <AnimatePresence>
              {intervalDays > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Auto-Connect to Database
                    <span className="text-rose-500">*</span>
                  </label>

                  {loadingConns ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-xl text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading connections…
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-sm text-rose-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      No database connections found. Add one in Connections.
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setConnDropOpen(!connDropOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 bg-background border rounded-xl text-sm transition-colors ${
                          connectionId
                            ? "border-primary/40 text-foreground"
                            : "border-border text-muted-foreground"
                        } hover:border-primary/60`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connectionId ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                          <span className="truncate">
                            {selectedConn ? selectedConn.name : "Select a connection…"}
                          </span>
                          {selectedConn && (
                            <span className="shrink-0 text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                              {selectedConn.db_type?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${connDropOpen ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {connDropOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto"
                          >
                            {connections.map((conn) => (
                              <button
                                key={conn.id}
                                onClick={() => {
                                  setConnectionId(conn.id);
                                  setConnDropOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${
                                  connectionId === conn.id ? "bg-primary/5 text-primary" : "text-foreground"
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${conn.is_active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                                <span className="truncate flex-1">{conn.name}</span>
                                <span className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md shrink-0">
                                  {conn.db_type?.toUpperCase()}
                                </span>
                                {connectionId === conn.id && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info box */}
            <div className="rounded-xl bg-muted/30 border border-border p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Next scheduled refresh</span>
                </div>
                <span className={`font-medium ${nextPreview ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {nextPreview
                    ? `${fmtRelative(nextPreview)} · ${fmtDateTime(nextPreview)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last refreshed</span>
                </div>
                <span className="font-medium text-foreground">
                  {report?.last_refreshed_at ? fmtDateTime(report.last_refreshed_at) : "Never"}
                </span>
              </div>
            </div>

            {/* Validation warning */}
            {intervalDays > 0 && !connectionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-600 dark:text-amber-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                Please select a database connection to enable auto-refresh
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving || (intervalDays > 0 && !connectionId)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                saving || (intervalDays > 0 && !connectionId)
                  ? "bg-primary/40 text-primary-foreground/60 cursor-not-allowed"
                  : saveStatus === "success"
                  ? "bg-emerald-500 text-white"
                  : saveStatus === "error"
                  ? "bg-rose-500 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : saveStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </>
              ) : saveStatus === "error" ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Error — try again
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
