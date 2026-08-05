import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import ScheduleModal from "./ScheduleModal";
import {
  EmptyState,
  MetricCard,
  PageFrame,
  PageLead,
  SegmentedControl,
} from "./ui/product-ui";
import { SlidingNumber } from "./animate-ui/primitives/texts/sliding-number";
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
  Clock,
  Sparkles,
  PieChart,
  Table,
  BarChart2,
  LineChart as LineChartIcon,
  X,
  ExternalLink,
  Share2,
  CheckCheck,
  Tag,
  Columns3,
  Activity,
  FileText,
  Zap,
  CalendarClock,
  ArrowLeft,
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



// ── Report Card ──────────────────────────────────────────────────────────────

function SortableReportCard({ report, onUnpin, onOpen, onSchedule, reorderable = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: report.id, disabled: !reorderable });
  const [copied, setCopied] = useState(false);
  const [renderTime] = useState(Date.now);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 30 : "auto",
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
    >
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isDragging ? 0.9 : 1,
        y: isDragging ? -3 : 0,
        scale: isDragging ? 1.018 : 1,
        rotate: isDragging ? 0.35 : 0,
      }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={`app-card interactive-card group flex h-full flex-col overflow-hidden rounded-2xl ${
        isDragging ? "ring-2 ring-primary/35 shadow-2xl shadow-primary/15" : ""
      }`}
    >
      {/* Header */}
      <div className="soft-divider flex items-center justify-between border-b bg-muted/25 px-4 py-3">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {reorderable && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              onClick={(event) => event.stopPropagation()}
              className="touch-none cursor-grab rounded-lg p-1 text-muted-foreground/45 transition-all hover:bg-card hover:text-foreground active:cursor-grabbing active:scale-95"
              aria-label={`Reorder ${report.title}`}
              aria-pressed={isDragging}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/8 px-2 py-1 text-xs font-semibold text-primary">
            {chartIcon[report.chartType] || <BarChart2 className="w-3.5 h-3.5" />}
            <span className="capitalize">{report.chartType || "bar"}</span>
          </div>
          <span className="font-semibold text-sm truncate flex-1 text-foreground">
            {report.title}
          </span>
        </div>

        {/* Action buttons — visible on hover */}
        <div
          className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => copyLink(report.id, setCopied)}
            title={copied ? "Copied!" : "Copy shareable link"}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSchedule?.(report)}
            title="Schedule auto-refresh"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body — clickable to open report */}
      <div
        className="flex-1 cursor-pointer p-4"
        onClick={() => onOpen?.(report)}
      >
        {/* Template ID badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Tag className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="truncate text-xs text-muted-foreground/75">
            {report.query_template_id || report.query || "—"}
          </span>
        </div>

        {/* Column preview */}
        {colCount > 0 ? (
          <div className="space-y-2 rounded-xl border border-border/55 bg-muted/35 p-3">
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
                  className="max-w-[120px] truncate rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground/80"
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
        className="soft-divider flex cursor-pointer items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"
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
                          ? `in ${Math.ceil((new Date(report.next_refresh_at) - renderTime) / 86400000)}d`
                          : `in ${Math.ceil((new Date(report.next_refresh_at) - renderTime) / 60000)}m`
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
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports: contextReports, togglePinReport, isLoadingReports, user } = useApp();

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
    return {
      total: window.length,
      pinned: pinned.length,
      hoursSaved: hrsSaved,
      minutesSaved: minLeft,
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
        subtitle: "",
        icon: null,
        actions: (
          <button
            onClick={() => setShowAllReports((prev) => !prev)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-accent/60"
          >
            {showAllReports ? <ArrowLeft className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {showAllReports ? "Back to pinned" : "Browse all reports"}
          </button>
        ),
      });
    }
  }, [allReports.length, setHeaderConfig, reports.length, showAllReports]);

  // ── Stat day options ──────────────────────────────────────────────────────

  const DAY_OPTIONS = [7, 10, 30, 90];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="custom-scrollbar h-full w-full flex-1 overflow-y-auto">
      <PageFrame>
        <PageLead
          title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
          description="Track report activity and return to your pinned analysis."
        />

        {/* ── Stats section ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Day filter pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Activity</p>
              <p className="text-xs text-muted-foreground">A quick view of recent report usage.</p>
            </div>
            <SegmentedControl
              value={statDays}
              onValueChange={setStatDays}
              ariaLabel="Dashboard period"
              items={DAY_OPTIONS.map((days) => ({ value: days, label: `${days} days`, shortLabel: `${days}d` }))}
              compactOnMobile
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              icon={FileText}
              label="Reports generated"
              value={<SlidingNumber number={stats.total} fromNumber={0} />}
              detail={`Last ${statDays} days`}
            />
            <MetricCard
              icon={Zap}
              label="Estimated time saved"
              value={(
                <span className="inline-flex items-center gap-1.5 leading-none">
                  {stats.hoursSaved > 0 && (
                    <SlidingNumber
                      number={stats.hoursSaved}
                      fromNumber={0}
                      delay={0.04}
                      suffix="h"
                    />
                  )}
                  <SlidingNumber
                    number={stats.minutesSaved}
                    fromNumber={0}
                    delay={0.08}
                    suffix="m"
                  />
                </span>
              )}
              detail="About 45 min per report"
              tone="amber"
            />
            <MetricCard
              icon={Activity}
              label="Pinned reports"
              value={<SlidingNumber number={stats.pinned} fromNumber={0} delay={0.08} />}
              detail="Ready on your dashboard"
              tone="emerald"
            />
            <MetricCard
              icon={Sparkles}
              label="Templates used"
              value={<SlidingNumber number={stats.templates} fromNumber={0} delay={0.12} />}
              detail={`Last ${statDays} days`}
              tone="violet"
            />
          </motion.div>
        </div>

        {/* ── Search + filters ────────────────────────────────────────── */}
        <div className="app-surface mt-6 flex flex-col gap-3 rounded-2xl p-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name or template…"
              className="h-10 w-full rounded-xl border border-transparent bg-muted/55 pl-11 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/80 focus:border-primary/25 focus:bg-card focus:ring-4 focus:ring-primary/8"
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
            <SegmentedControl
              value={filterType}
              onValueChange={setFilterType}
              ariaLabel="Report type"
              compactOnMobile
              items={[
                { value: "all", label: "All", icon: Filter },
                { value: "bar", label: "Bar", icon: BarChart2 },
                { value: "line", label: "Line", icon: LineChartIcon },
                { value: "pie", label: "Pie", icon: PieChart },
                { value: "table", label: "Table", icon: Table },
              ]}
            />

            {/* View mode */}
            <div className="flex items-center rounded-xl border border-border/65 bg-muted/60 p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PageFrame>

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
