import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  MoreHorizontal, 
  Maximize2, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  BarChart2,
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
  LineChart,
  X,
  Plus,
  ChevronDown,
  ExternalLink,
  Download,
  Star,
  StarOff
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  LineChart as RechartsLine, 
  Line, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { mockReports, kpiData } from "../services/mockData";

// Mini chart component for KPI cards
function MiniChart({ data, type = "area", color = "#2563eb" }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data.map((v, i) => ({ value: v, index: i }))}>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Report preview chart
function ReportPreviewChart({ report }) {
  const data = report.data?.slice(0, 5) || [];
  const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
  
  if (report.chartType === "pie" || report.chartType === "donut") {
    return (
      <ResponsiveContainer width="100%" height={120}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={report.chartType === "donut" ? 25 : 0}
            outerRadius={45}
            dataKey={Object.keys(data[0] || {}).find(k => typeof data[0]?.[k] === 'number') || 'value'}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </RechartsPie>
      </ResponsiveContainer>
    );
  }
  
  if (report.chartType === "line") {
    const numKey = Object.keys(data[0] || {}).find(k => typeof data[0]?.[k] === 'number');
    return (
      <ResponsiveContainer width="100%" height={120}>
        <RechartsLine data={data}>
          <Line type="monotone" dataKey={numKey} stroke="#2563eb" strokeWidth={2} dot={false} />
        </RechartsLine>
      </ResponsiveContainer>
    );
  }
  
  // Default: bar chart
  const numKey = Object.keys(data[0] || {}).find(k => typeof data[0]?.[k] === 'number');
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <Bar dataKey={numKey || 'revenue'} fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SortableReportCard({ report, onUnpin, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: report.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const chartIcon = {
    bar: <BarChart2 className="w-4 h-4" />,
    line: <LineChart className="w-4 h-4" />,
    pie: <PieChart className="w-4 h-4" />,
    donut: <PieChart className="w-4 h-4" />,
    table: <Table className="w-4 h-4" />,
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-sm border border-border flex flex-col group hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => onOpen?.(report)}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div 
            {...attributes} 
            {...listeners} 
            onClick={e => e.stopPropagation()}
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md">
            {chartIcon[report.chartType] || <BarChart2 className="w-4 h-4" />}
          </div>
          <span className="font-semibold text-sm truncate flex-1">{report.title}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onUnpin?.(report.id)}
            className="p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-md transition-colors"
            title="Unpin from dashboard"
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Preview Chart */}
      <div className="p-4 flex-1">
        <ReportPreviewChart report={report} />
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{report.data?.length || 0} rows</span>
          <span>•</span>
          <span>{report.tables?.length || 0} tables</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(mockReports.filter(r => r.isPinned));
  const [allReports, setAllReports] = useState(mockReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [filterType, setFilterType] = useState("all"); // all | bar | line | pie | table
  const [showAllReports, setShowAllReports] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReports((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUnpin = (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    setAllReports(prev => prev.map(r => r.id === reportId ? { ...r, isPinned: false } : r));
  };

  const handlePin = (report) => {
    if (!reports.find(r => r.id === report.id)) {
      setReports(prev => [...prev, { ...report, isPinned: true }]);
      setAllReports(prev => prev.map(r => r.id === report.id ? { ...r, isPinned: true } : r));
    }
  };

  const filteredReports = useMemo(() => {
    let filtered = showAllReports ? allReports : reports;
    
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.query?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(r => r.chartType === filterType);
    }
    
    return filtered;
  }, [reports, allReports, searchQuery, filterType, showAllReports]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full h-full bg-background custom-scrollbar">
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {reports.length} pinned reports • Drag to reorder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAllReports(!showAllReports)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                showAllReports 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {showAllReports ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
              {showAllReports ? 'Showing All' : 'All Reports'}
            </button>
            <button className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  kpi.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold mb-3">{kpi.value}</p>
              <MiniChart data={kpi.trend} color={kpi.type === 'positive' ? '#22c55e' : '#ef4444'} />
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary/50 transition-colors shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter by type */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              {[
                { id: 'all', label: 'All', icon: Filter },
                { id: 'bar', label: 'Bar', icon: BarChart2 },
                { id: 'line', label: 'Line', icon: LineChart },
                { id: 'pie', label: 'Pie', icon: PieChart },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === f.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{f.label}</span>
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={filteredReports.map(r => r.id)}
            strategy={rectSortingStrategy}
          >
            <div className={`grid gap-6 pb-20 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {filteredReports.map(report => (
                  report.isPinned || showAllReports ? (
                    <SortableReportCard 
                      key={report.id} 
                      report={report} 
                      onUnpin={handleUnpin}
                      onOpen={(report) => navigate('/report', { state: { query: report.query || report.title, data: report } })}
                    />
                  ) : null
                ))}
              </AnimatePresence>
              
              {/* Empty state or Add placeholder */}
              {filteredReports.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery ? `No reports matching "${searchQuery}"` : 'Generate reports via AI Chat and pin them here'}
                  </p>
                </motion.div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center min-h-[250px] bg-transparent hover:bg-muted/50 cursor-pointer transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-sm text-foreground/80">Add another report</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center px-4">Generate via AI Chat to pin here</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

    </div>
  );
}
