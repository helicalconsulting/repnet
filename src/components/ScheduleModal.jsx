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
  CalendarClock,
  Ban,
  Minus,
  Plus,
} from "lucide-react";
import { reportApi, databaseApi } from "../services/api";

// ── Quick preset pills ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Off", value: 0, icon: Ban },
  { label: "1d", value: 1, icon: CalendarClock },
  { label: "2d", value: 2, icon: CalendarClock },
  { label: "3d", value: 3, icon: CalendarClock },
  { label: "7d", value: 7, icon: CalendarClock },
  { label: "14d", value: 14, icon: CalendarClock },
  { label: "30d", value: 30, icon: CalendarClock },
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

function fmtRelative(date) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / 86400000);
  const hrs = Math.floor(absDiff / 3600000);
  const mins = Math.floor(absDiff / 60000);
  if (days > 0) return diff > 0 ? `in ${days}d` : `${days}d ago`;
  if (hrs > 0) return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`;
  return diff > 0 ? `in ${mins}m` : `just now`;
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function ScheduleModal({ report, onClose, onSaved }) {
  const initial = report?.refresh_interval_days ?? 0;
  const [intervalDays, setIntervalDays] = useState(initial);
  const [customInput, setCustomInput] = useState(
    initial > 0 && !PRESETS.some((p) => p.value === initial) ? String(initial) : ""
  );
  const [useCustom, setUseCustom] = useState(
    initial > 0 && !PRESETS.some((p) => p.value === initial)
  );

  const [connectionId, setConnectionId] = useState(
    report?.auto_refresh_connection_id ?? ""
  );
  const [connections, setConnections] = useState([]);
  const [loadingConns, setLoadingConns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [connDropOpen, setConnDropOpen] = useState(false);

  // Effective interval days value
  const effectiveDays = useCustom
    ? Math.max(0, Math.min(365, parseInt(customInput) || 0))
    : intervalDays;

  useEffect(() => {
    databaseApi
      .getConnections()
      .then((d) => setConnections(d || []))
      .catch(() => {})
      .finally(() => setLoadingConns(false));
  }, []);

  const selectedConn = connections.find((c) => c.id === connectionId);

  const handlePresetClick = (val) => {
    setUseCustom(false);
    setCustomInput("");
    setIntervalDays(val);
  };

  const handleCustomChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setCustomInput(raw);
    setUseCustom(true);
    setIntervalDays(0); // deselect preset
  };

  const handleStepper = (delta) => {
    const current = effectiveDays;
    const next = Math.max(0, Math.min(365, current + delta));
    setUseCustom(true);
    setCustomInput(String(next));
    setIntervalDays(0);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const updated = await reportApi.setSchedule(report.id, {
        intervalDays: effectiveDays || null,
        connectionId: connectionId || null,
      });
      setSaveStatus("success");
      onSaved?.(updated);
      setTimeout(() => onClose(), 1000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const nextPreview =
    effectiveDays > 0 && connectionId
      ? new Date(Date.now() + effectiveDays * 86400000)
      : null;

  const isOff = effectiveDays === 0;
  const canSave = isOff || (effectiveDays > 0 && !!connectionId);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="bd"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-violet-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Schedule Auto-Refresh
                </h2>
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

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="p-6 space-y-5">

            {/* Refresh Interval */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Interval
              </label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isActive = !useCustom && intervalDays === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => handlePresetClick(p.value)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isActive
                          ? p.value === 0
                            ? "bg-rose-500/10 border-rose-500/40 text-rose-500"
                            : "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom days input */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Or enter a custom interval:
                </p>
                <div className={`flex items-center gap-0 border rounded-xl overflow-hidden transition-colors ${
                  useCustom && effectiveDays > 0
                    ? "border-primary/50 bg-primary/3"
                    : "border-border bg-background"
                }`}>
                  {/* Minus */}
                  <button
                    onClick={() => handleStepper(-1)}
                    disabled={effectiveDays <= 0}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  {/* Input */}
                  <div className="flex-1 flex items-center justify-center gap-1.5 px-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={useCustom ? customInput : intervalDays > 0 ? String(intervalDays) : ""}
                      onChange={handleCustomChange}
                      placeholder="e.g. 5"
                      className="w-16 text-center text-sm font-semibold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      {effectiveDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  {/* Plus */}
                  <button
                    onClick={() => handleStepper(1)}
                    disabled={effectiveDays >= 365}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  Min: 1 day · Max: 365 days
                </p>
              </div>
            </div>

            {/* Connection selector — only when interval > 0 */}
            <AnimatePresence>
              {effectiveDays > 0 && (
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
                      No database connections found.
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
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              connectionId
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                          <span className="truncate">
                            {selectedConn
                              ? selectedConn.name
                              : "Select a connection…"}
                          </span>
                          {selectedConn && (
                            <span className="shrink-0 text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                              {selectedConn.db_type?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${
                            connDropOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {connDropOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden max-h-44 overflow-y-auto"
                          >
                            {connections.map((conn) => (
                              <button
                                key={conn.id}
                                onClick={() => {
                                  setConnectionId(conn.id);
                                  setConnDropOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors ${
                                  connectionId === conn.id
                                    ? "bg-primary/5 text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    conn.is_active
                                      ? "bg-emerald-500"
                                      : "bg-muted-foreground/30"
                                  }`}
                                />
                                <span className="truncate flex-1">
                                  {conn.name}
                                </span>
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
            <div className="rounded-xl bg-muted/30 border border-border p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5" />
                  Next scheduled refresh
                </div>
                <span
                  className={`font-medium ${
                    nextPreview ? "text-foreground" : "text-muted-foreground/40"
                  }`}
                >
                  {nextPreview
                    ? `${fmtRelative(nextPreview)} · ${fmtDateTime(nextPreview)}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Last refreshed
                </div>
                <span className="font-medium text-foreground">
                  {report?.last_refreshed_at
                    ? fmtDateTime(report.last_refreshed_at)
                    : "Never"}
                </span>
              </div>
            </div>

            {/* Validation warning */}
            {effectiveDays > 0 && !connectionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-600 dark:text-amber-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                Select a database connection to enable auto-refresh
              </motion.div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                saving || !canSave
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
                  {isOff ? "Disable Schedule" : "Save Schedule"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
