import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  Clock,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Table2,
  TrendingUp,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { reportApi } from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function fmtMs(ms) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Mini Data Preview ─────────────────────────────────────────────────────────

function DataPreview({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        No data in this snapshot
      </div>
    );
  }
  const headers = Object.keys(rows[0]);
  const preview = rows.slice(0, 5);

  return (
    <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border/50 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/10"}`}
            >
              {headers.map((h) => (
                <td
                  key={h}
                  className="px-3 py-2 text-foreground whitespace-nowrap max-w-[180px] truncate"
                  title={String(row[h] ?? "")}
                >
                  {row[h] !== null && typeof row[h] === 'object'
                    ? (row[h].type === 'Point' && Array.isArray(row[h].coordinates)
                        ? `Point(${row[h].coordinates.join(', ')})`
                        : JSON.stringify(row[h]))
                    : (row[h] ?? <span className="text-muted-foreground/40 italic">null</span>)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <div className="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/20">
          + {rows.length - 5} more rows
        </div>
      )}
    </div>
  );
}

// ── Single Snapshot Row ───────────────────────────────────────────────────────

function SnapshotRow({ snap, reportId, isFirst }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (detail) return; // already loaded
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const d = await reportApi.getSnapshotDetail(reportId, snap.id);
      setDetail(d);
    } catch (err) {
      setDetailError(err.message || "Failed to load preview");
    } finally {
      setLoadingDetail(false);
    }
  };

  const isScheduled = snap.triggered_by === "scheduled";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Timeline line */}
      <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />

      <div className="flex gap-3">
        {/* Timeline dot */}
        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          isFirst
            ? "bg-primary/10 border-primary"
            : "bg-muted/40 border-border"
        }`}>
          {isScheduled
            ? <Bot className={`w-4 h-4 ${isFirst ? "text-primary" : "text-muted-foreground"}`} />
            : <User className={`w-4 h-4 ${isFirst ? "text-primary" : "text-muted-foreground"}`} />
          }
        </div>

        {/* Content card */}
        <div className="flex-1 min-w-0 mb-4">
          <div
            onClick={handleExpand}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              expanded
                ? "border-primary/40 bg-primary/3"
                : "border-border hover:border-primary/30 hover:bg-muted/30 bg-card"
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                    isScheduled
                      ? "bg-primary/10 text-primary"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {isScheduled ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {isScheduled ? "Scheduled" : "Manual"}
                </span>
                {isFirst && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-semibold uppercase tracking-wide">
                    Latest
                  </span>
                )}
              </div>
              <button
                className="p-1 rounded hover:bg-muted/60 text-muted-foreground transition-colors"
              >
                {expanded
                  ? <ChevronUp className="w-4 h-4" />
                  : <ChevronDown className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Meta */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span title={fmtDateTime(snap.created_at)}>{fmtRelative(snap.created_at)}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{fmtDateTime(snap.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Table2 className="w-3 h-3" />
                <span>{snap.rows_returned?.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{fmtMs(snap.execution_time_ms)}</span>
              </div>
            </div>
          </div>

          {/* Expanded preview */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                   {loadingDetail ? (
                    <SmartSkeleton loading={true}>
                      <div className="border border-border rounded-xl bg-card p-4 space-y-3">
                        <div className="flex gap-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-6 bg-muted rounded w-1/4 animate-pulse" />
                          ))}
                        </div>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex gap-2 pt-2 border-t border-border/40">
                            {Array.from({ length: 4 }).map((_, j) => (
                              <div key={j} className="h-4 bg-muted/60 rounded w-1/4 animate-pulse" />
                            ))}
                          </div>
                        ))}
                      </div>
                    </SmartSkeleton>
                  ) : detailError ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {detailError}
                    </div>
                  ) : detail ? (
                    <DataPreview rows={detail.rows_data} />
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SnapshotHistory({
  report,
  /** If provided, show an inline manual refresh button */
  onManualRefresh,
  /** Pass connection options for manual refresh */
  connections = [],
}) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!report?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getSnapshots(report.id, 20);
      setSnapshots(data);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [report?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Report History</span>
          {snapshots.length > 0 && (
            <span className="px-2 py-0.5 bg-muted/60 text-muted-foreground rounded-full text-xs font-medium">
              {snapshots.length}
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
          title="Reload history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* States */}
      <SmartSkeleton loading={loading}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-1/12 animate-pulse" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <div className="h-3 bg-muted rounded w-1/5 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/6 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/6 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={load} className="text-xs text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-border rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center">
              <Clock className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run this report manually or set up a schedule to start tracking history
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-1">
            <AnimatePresence>
              {snapshots.map((snap, i) => (
                <SnapshotRow
                  key={snap.id}
                  snap={snap}
                  reportId={report.id}
                  isFirst={i === 0}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </SmartSkeleton>
    </div>
  );
}
