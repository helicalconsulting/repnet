import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import ScheduleModal from "./ScheduleModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutDashboard,
  GripVertical,
  Maximize2,
  Search,
  Filter,
  Grid3X3,
  List,
  PinOff,
  TrendingUp,
  Clock,
  Sparkles,
  PieChart,
  Table,
  BarChart2,
  LineChart as LineChartIcon,
  X,
  Plus,
  ExternalLink,
  Share2,
  CheckCheck,
  Tag,
  Columns3,
  ChevronDown,
  Star,
  StarOff,
  Activity,
  FileText,
  Zap,
  Calendar,
  CalendarClock,
  RefreshCw,
} from "lucide-react";

// ── Date helpers ─────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function withinDays(dateStr, n) {
  if (!dateStr) return false;
  return new Date(dateStr) >= daysAgo(n);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Share helper ─────────────────────────────────────────────────────────────

async function copyLink(reportId, setCopied) {
  const url = `${window.location.origin}/report/${reportId}`;
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    prompt("Copy this link:", url);
  }
}

// ── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Report Card ──────────────────────────────────────────────────────────────

function SortableReportCard({ report, onUnpin, onOpen, onSchedule }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: report.id });
  const [copied, setCopied] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const chartIcon = {
    bar: <BarChart2 className="w-4 h-4" />,
    line: <LineChartIcon className="w-4 h-4" />,
    pie: <PieChart className="w-4 h-4" />,
    donut: <PieChart className="w-4 h-4" />,
    table: <Table className="w-4 h-4" />,
  };

  const columns = report.columns || [];
  const colCount = columns.length;
  const colPreview = columns
    .slice(0, 4)
    .map((c) => c.display_name || c.column_name)
    .join(", ");

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-sm border border-border flex flex-col group hover:border-primary/40 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20 rounded-t-2xl">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 text-foreground border border-border/50 rounded-lg text-xs font-semibold">
            {chartIcon[report.chartType] || <BarChart2 className="w-3.5 h-3.5" />}
            <span className="capitalize">{report.chartType || "bar"}</span>
          </div>
          <span className="font-semibold text-sm truncate flex-1 text-foreground">
            {report.title}
          </span>
        </div>

        {/* Action buttons — visible on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => copyLink(report.id, setCopied)}
            title={copied ? "Copied!" : "Copy shareable link"}
            className={`p-1.5 rounded-lg transition-colors ${
              copied
                ? "text-emerald-500 bg-emerald-500/10"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onOpen?.(report)}
            title="Open report"
            className="p-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSchedule?.(report)}
            title="Schedule auto-refresh"
            className={`p-1.5 rounded-lg transition-colors ${
              (report.refresh_interval_days > 0 || report.refresh_interval_minutes > 0)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUnpin?.(report.id)}
            title="Unpin from dashboard"
            className="p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body — clickable to open report */}
      <div
        className="p-4 flex-1 cursor-pointer"
        onClick={() => onOpen?.(report)}
      >
        {/* Template ID badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Tag className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-xs text-muted-foreground/70 truncate font-mono">
            {report.query_template_id || report.query || "—"}
          </span>
        </div>

        {/* Column preview */}
        {colCount > 0 ? (
          <div className="bg-muted/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Columns3 className="w-3.5 h-3.5" />
                {colCount} column{colCount !== 1 ? "s" : ""}
              </div>
              <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                Schema
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {columns.slice(0, 5).map((col) => (
                <span
                  key={col.id || col.column_name}
                  className="px-2 py-0.5 bg-background border border-border rounded-md text-[11px] text-foreground/80 font-mono truncate max-w-[120px]"
                  title={col.column_name}
                >
                  {col.display_name || col.column_name}
                </span>
              ))}
              {colCount > 5 && (
                <span className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded-md text-[11px] font-medium">
                  +{colCount - 5} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-center text-muted-foreground/50 text-sm">
            No schema preview
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground cursor-pointer"
        onClick={() => onOpen?.(report)}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{fmtDate(report.createdAt || report.created_at)}</span>
          </div>
          {/* Schedule badge */}
          {((report.refresh_interval_days > 0) || (report.refresh_interval_minutes > 0)) && (
            <div className="flex items-center gap-1 text-primary/70">
              <CalendarClock className="w-3 h-3 shrink-0" />
              <span>
                {report.refresh_interval_days > 0 
                  ? (report.refresh_interval_days === 1 ? "Daily" : `Every ${report.refresh_interval_days}d`)
                  : `Every ${report.refresh_interval_minutes}m`
                }
                {report.next_refresh_at && (
                  <span className="text-muted-foreground/50 ml-1">
                    · next {new Date(report.next_refresh_at) > new Date()
                      ? (report.refresh_interval_days > 0 
                          ? `in ${Math.ceil((new Date(report.next_refresh_at) - Date.now()) / 86400000)}d`
                          : `in ${Math.ceil((new Date(report.next_refresh_at) - Date.now()) / 60000)}m`
                        )
                      : "soon"
                    }
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-primary/80 font-medium hover:text-primary">
          <ExternalLink className="w-3 h-3" />
          <span>Open Report</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports: contextReports, togglePinReport, isLoadingReports } = useApp();

  const [reports, setReports] = useState([]);      // pinned
  const [allReports, setAllReports] = useState([]); // all
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");
  const [showAllReports, setShowAllReports] = useState(false);
  const [statDays, setStatDays] = useState(30); // 7 | 10 | 30 | 90
  const [scheduleReport, setScheduleReport] = useState(null); // report to schedule

  // Sync from context whenever reports change
  useEffect(() => {
    if (contextReports) {
      setAllReports(contextReports);
      setReports(contextReports.filter((r) => r.isPinned));
    }
  }, [contextReports]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const window = allReports.filter((r) => withinDays(r.createdAt || r.created_at, statDays));
    const pinned = allReports.filter((r) => r.isPinned);
    // Rough "time saved": assume each report = 45 min manual work
    const minSaved = window.length * 45;
    const hrsSaved = Math.floor(minSaved / 60);
    const minLeft = minSaved % 60;
    const timeSaved = hrsSaved > 0 ? `${hrsSaved}h ${minLeft}m` : `${minLeft}m`;
    return {
      total: window.length,
      pinned: pinned.length,
      timeSaved,
      templates: [...new Set(window.map((r) => r.query_template_id || r.query).filter(Boolean))].length,
    };
  }, [allReports, statDays]);

  // ── DnD ─────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setReports((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUnpin = async (reportId) => {
    // Optimistic local removal
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    try {
      await togglePinReport(reportId);
    } catch (err) {
      console.error("Failed to unpin:", err);
    }
  };

  const handlePin = async (report) => {
    try {
      await togglePinReport(report.id);
    } catch (err) {
      console.error("Failed to pin:", err);
    }
  };

  const handleOpen = (report) => {
    navigate(`/report/${report.id}`);
  };

  const handleScheduleSaved = (updatedReport) => {
    // Update local state with new schedule fields
    setAllReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    );
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    );
    setScheduleReport(null);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const source = showAllReports ? allReports : reports;

  const filteredReports = useMemo(() => {
    let f = source;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.query_template_id?.toLowerCase().includes(q) ||
          r.query?.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      f = f.filter((r) => (r.chartType || "bar") === filterType);
    }
    return f;
  }, [source, searchQuery, filterType]);

  const { setHeaderConfig } = useOutletContext() || {};

  useEffect(() => {
    if (setHeaderConfig) {
      setHeaderConfig({
        title: "Dashboard",
        subtitle: `${reports.length} pinned report${reports.length !== 1 ? "s" : ""} • Drag to reorder`,
        icon: <LayoutDashboard className="w-4 h-4 text-foreground" />,
        actions: (
          <button
            onClick={() => setShowAllReports((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showAllReports
                ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-sm"
                : "bg-card border border-border hover:bg-muted/60 text-foreground"
            }`}
          >
            {showAllReports ? <Star className="w-3.5 h-3.5" /> : <StarOff className="w-3.5 h-3.5" />}
            {showAllReports ? "Showing All" : "All Reports"}
          </button>
        ),
      });
    }
  }, [setHeaderConfig, reports.length, showAllReports]);

  // ── Stat day options ──────────────────────────────────────────────────────

  const DAY_OPTIONS = [7, 10, 30, 90];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full h-full bg-background custom-scrollbar">
      <div className="w-full space-y-6">

        {/* ── Stats section ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Day filter pills */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Period:</span>
            <div className="flex items-center gap-1 bg-card border border-border/80 rounded-xl p-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setStatDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statDays === d
                      ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Reports Generated"
              value={stats.total}
              sub={`Last ${statDays} days`}
              color="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              icon={Zap}
              label="Time Saved"
              value={stats.timeSaved}
              sub="~45 min per report"
              color="bg-amber-500/10 text-amber-500"
            />
            <StatCard
              icon={Activity}
              label="Pinned Reports"
              value={stats.pinned}
              sub="On dashboard"
              color="bg-emerald-500/10 text-emerald-500"
            />
            <StatCard
              icon={Sparkles}
              label="Templates Used"
              value={stats.templates}
              sub={`Last ${statDays} days`}
              color="bg-violet-500/10 text-violet-500"
            />
          </div>
        </div>

        {/* ── Search + filters ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name or template…"
              className="w-full pl-11 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/60 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chart type filter */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              {[
                { id: "all", label: "All", icon: Filter },
                { id: "bar", label: "Bar", icon: BarChart2 },
                { id: "line", label: "Line", icon: LineChartIcon },
                { id: "pie", label: "Pie", icon: PieChart },
                { id: "table", label: "Table", icon: Table },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === f.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{f.label}</span>
                </button>
              ))}
            </div>

            {/* View mode */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Reports Grid ────────────────────────────────────────────── */}
        <SmartSkeleton loading={isLoadingReports}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={isLoadingReports ? [1, 2, 3, 4, 5, 6] : filteredReports.map((r) => r.id)} strategy={rectSortingStrategy}>
              <div
                className={`grid gap-5 pb-20 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {isLoadingReports ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-sm">
                      <div className="h-6 w-1/3 bg-muted rounded-md" />
                      <div className="h-4 w-3/4 bg-muted rounded-md" />
                      <div className="h-20 bg-muted rounded-xl" />
                      <div className="h-6 w-1/2 bg-muted rounded-md" />
                    </div>
                  ))
                ) : (
                  <AnimatePresence>
                    {filteredReports.map((report) => (
                      <SortableReportCard
                        key={report.id}
                        report={report}
                        onUnpin={handleUnpin}
                        onOpen={handleOpen}
                        onSchedule={(r) => setScheduleReport(r)}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Empty state */}
                {!isLoadingReports && filteredReports.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-primary/50" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">No reports found</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {searchQuery
                        ? `No reports matching "${searchQuery}"`
                        : "Generate reports via AI Chat and pin them here"}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => navigate("/chat")}
                        className="mt-5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate a Report
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Add placeholder card */}
                {!isLoadingReports && filteredReports.length > 0 && !showAllReports && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate("/chat")}
                    className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center min-h-[200px] bg-transparent hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm text-foreground/70">Add another report</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Generate via AI Chat</p>
                  </motion.div>
                )}

                {/* "Pin from All Reports" hint */}
                {!isLoadingReports && showAllReports && filteredReports.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-4 text-xs text-muted-foreground/60"
                  >
                    Showing all {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} — click a card to open, or use the pin button to add to your dashboard
                  </motion.div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </SmartSkeleton>
      </div>

      {/* Schedule Modal */}
      {scheduleReport && (
        <ScheduleModal
          report={scheduleReport}
          onClose={() => setScheduleReport(null)}
          onSaved={handleScheduleSaved}
        />
      )}
    </div>
  );
}
