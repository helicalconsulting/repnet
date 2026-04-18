import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Table as TableIcon, 
  BarChart2, 
  LayoutDashboard, 
  Download, 
  Settings, 
  RefreshCw, 
  X,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Circle,
  Palette,
  GripVertical,
  ChevronDown,
  Check,
  Pin,
  PinOff,
  Copy,
  Code,
  FileText,
  Share2,
  Maximize2,
  Minimize2,
  ArrowDownToLine,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "../context/AppContext";
import { chartColors, chartTypes } from "../services/mockData";

const dummyData = [
  { id: "1", product: "Quantum Server X1", revenue: 145000, margin: 42, quantity: 24, category: "Hardware" },
  { id: "2", product: "Neural Processor Unit", revenue: 98000, margin: 35, quantity: 156, category: "Components" },
  { id: "3", product: "Holographic Display", revenue: 76000, margin: 28, quantity: 89, category: "Displays" },
  { id: "4", product: "Quantum Storage Array", revenue: 54000, margin: 45, quantity: 12, category: "Storage" },
  { id: "5", product: "Synaptic Bridge", revenue: 32000, margin: 60, quantity: 410, category: "Networking" },
  { id: "6", product: "Photonic Router", revenue: 28000, margin: 38, quantity: 67, category: "Networking" },
  { id: "7", product: "AI Accelerator Card", revenue: 24000, margin: 52, quantity: 34, category: "Components" },
  { id: "8", product: "Memory Matrix", revenue: 19000, margin: 33, quantity: 189, category: "Memory" }
];

const mockSQL = `SELECT 
  p.name as product,
  SUM(s.amount) as revenue,
  ((SUM(s.amount) - SUM(p.cost * s.quantity)) / SUM(s.amount) * 100) as margin,
  SUM(s.quantity) as quantity,
  p.category
FROM products p
JOIN sales_transactions s ON p.id = s.product_id
WHERE s.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY p.id, p.name, p.category
HAVING margin > 10
ORDER BY revenue DESC
LIMIT 10;`;

function SortableColumn({ id, title }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `col-${id}` });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 10 : 1,
  };
  return (
    <th ref={setNodeRef} style={style} {...attributes} {...listeners} className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium bg-black/5 dark:bg-white/5 relative z-10 hover:bg-black/10 dark:hover:bg-white/10 touch-none first:rounded-tl-lg last:rounded-tr-lg">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
        {title}
      </div>
    </th>
  );
}

function SortableRow({ rowId, row, columns }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `row-${rowId}` });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
    zIndex: isDragging ? 2 : 1,
    position: isDragging ? "relative" : "static",
    backgroundColor: isDragging ? 'var(--card)' : undefined
  };
  
  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${isDragging ? 'bg-black/5 dark:bg-white/5' : ''}`}>
      <td className="px-2 py-3 sm:py-4 w-10 text-center relative">
        <div {...attributes} {...listeners} className="inline-flex items-center justify-center p-1 rounded cursor-grab active:cursor-grabbing hover:bg-black/10 dark:hover:bg-white/10 touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </td>
      {columns.map(key => {
        const value = row[key];
        return (
          <td key={key} className="px-3 sm:px-4 py-3 sm:py-4">
            {typeof value === 'number' && key.toLowerCase().includes('revenue') ? (
              `$${value.toLocaleString()}`
            ) : typeof value === 'number' && key.toLowerCase().includes('margin') ? (
              <span className={`px-2 py-1 rounded text-xs font-medium ${value > 40 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'}`}>
                {value}%
              </span>
            ) : typeof value === 'number' ? (
              value.toLocaleString()
            ) : (
              <span className="font-medium truncate block max-w-[140px] sm:max-w-[200px]">{value}</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

export default function ReportBuilder({ query, onClose, reportData, onToggleInsights }) {
  const { togglePinReport, saveReport, addNotification } = useApp();
  
  const [activeTab, setActiveTab] = useState("chart");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const [chartType, setChartType] = useState(reportData?.chartType || "bar");
  const [selectedColors, setSelectedColors] = useState(() => {
    const reportColors = reportData?.chartConfig?.colors;
    if (Array.isArray(reportColors) && reportColors.length > 0) {
      const matchedPalette = chartColors.find(palette => (
        palette.colors.length === reportColors.length &&
        palette.colors.every((color, idx) => color === reportColors[idx])
      ));
      return matchedPalette || { name: "Custom", colors: reportColors };
    }
    return chartColors[0];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDataKeys, setSelectedDataKeys] = useState(["revenue", "margin"]);
  const [xAxisKey, setXAxisKey] = useState("product");
  
  const [data, setData] = useState(() => reportData?.data || dummyData);
  const [columns, setColumns] = useState(() => {
    const initData = reportData?.data || dummyData;
    return initData.length > 0 ? Object.keys(initData[0]).filter(k => k !== 'id') : [];
  });
  
  const availableKeys = columns.filter(k => data.length > 0 && typeof data[0][k] === 'number');
  const displayedTab = isMobile && activeTab === 'split' ? 'chart' : activeTab;
  const chartHeight = displayedTab === 'split'
    ? (isMobile ? 260 : 320)
    : (isMobile ? 280 : 380);

  useEffect(() => {
    if (columns.length > 0 && data.length > 0) {
      const numCols = columns.filter(k => typeof data[0]?.[k] === 'number');
      setSelectedDataKeys(prev => {
        const active = prev.filter(p => numCols.includes(p));
        active.sort((a, b) => numCols.indexOf(a) - numCols.indexOf(b));
        return active.length ? active : [numCols[0]].filter(Boolean);
      });
      
      const firstCol = columns[0];
      if (typeof data[0]?.[firstCol] !== 'number') {
        setXAxisKey(firstCol);
      }
    }
  }, [columns]);

  useEffect(() => {
    if (!reportData) return;

    setChartType(reportData.chartType || "bar");

    const reportColors = reportData.chartConfig?.colors;
    if (Array.isArray(reportColors) && reportColors.length > 0) {
      const matchedPalette = chartColors.find(palette => (
        palette.colors.length === reportColors.length &&
        palette.colors.every((color, idx) => color === reportColors[idx])
      ));
      setSelectedColors(matchedPalette || { name: "Custom", colors: reportColors });
    } else {
      setSelectedColors(chartColors[0]);
    }
  }, [reportData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    if (active.id !== over.id) {
      if (active.id.toString().startsWith('col-') && over.id.toString().startsWith('col-')) {
        const oldIndex = columns.findIndex(c => `col-${c}` === active.id);
        const newIndex = columns.findIndex(c => `col-${c}` === over.id);
        setColumns(arrayMove(columns, oldIndex, newIndex));
      } 
      else if (active.id.toString().startsWith('row-') && over.id.toString().startsWith('row-')) {
        const oldIndex = data.findIndex(r => `row-${r.id}` === active.id);
        const newIndex = data.findIndex(r => `row-${r.id}` === over.id);
        setData(arrayMove(data, oldIndex, newIndex));
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePinToggle = () => {
    setIsPinned(!isPinned);
    addNotification('success', isPinned ? 'Report unpinned' : 'Report pinned to dashboard');
  };

  const handleExportCSV = () => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${Date.now()}.csv`;
    a.click();
    addNotification('success', 'CSV exported successfully');
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(mockSQL);
    addNotification('success', 'SQL copied to clipboard');
  };

  const renderChart = () => {
    const colors = selectedColors.colors;
    const xAxisProps = {
      dataKey: xAxisKey,
      stroke: "#888888",
      fontSize: isMobile ? 10 : 11,
      tickLine: false,
      axisLine: false,
      tickFormatter: (value) => String(value).split(' ')[0],
      angle: isMobile ? -30 : -45,
      textAnchor: "end",
      height: isMobile ? 50 : 60,
      interval: isMobile ? 0 : 'preserveStartEnd'
    };
    const legendProps = { wrapperStyle: { fontSize: isMobile ? 10 : 12 } };
    
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => typeof value === 'number' ? `${value/1000}k` : value} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
            <Legend {...legendProps} />
            {selectedDataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ fill: colors[i % colors.length], r: 4 }} />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
            <Legend {...legendProps} />
            {selectedDataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={colors[i % colors.length]} fillOpacity={0.3} stroke={colors[i % colors.length]} strokeWidth={2} />
            ))}
          </AreaChart>
        );
      
      case 'pie':
      case 'donut':
        return (
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={isMobile ? false : ({ name, percent }) => `${String(name).split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
              outerRadius={chartType === 'donut' ? 100 : 120}
              innerRadius={chartType === 'donut' ? 60 : 0}
              fill="#8884d8"
              dataKey={selectedDataKeys[0] || 'revenue'}
              nameKey={xAxisKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
            <Legend {...legendProps} />
          </RechartsPie>
        );
      
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} />
            <XAxis dataKey={selectedDataKeys[0] || 'revenue'} name={selectedDataKeys[0] || 'revenue'} stroke="#888888" fontSize={isMobile ? 10 : 12} tickLine={false} />
            <YAxis dataKey={selectedDataKeys[1] || 'margin'} name={selectedDataKeys[1] || 'margin'} stroke="#888888" fontSize={isMobile ? 10 : 12} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
            <Scatter name="Data" data={data} fill={colors[0]} />
          </ScatterChart>
        );
      
      default: // bar
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => typeof value === 'number' ? `$${value/1000}k` : value} />
            <Tooltip cursor={{fill: '#888888', opacity: 0.1}} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
            <Legend {...legendProps} />
            {selectedDataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
    }
  };

  return (
      <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 flex flex-col h-full bg-background overflow-hidden relative z-10 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Dynamic Header */}
      <div className="min-h-16 border-b border-border/50 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-card/30 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-0 sm:pr-4">
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
          <div className="overflow-hidden min-w-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 truncate text-sm sm:text-base">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              {query}
            </h2>
            <p className="text-[10px] text-muted-foreground">Generated from live ERP data • Just now</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* View Toggles */}
          <div className="flex items-center bg-black/5 dark:bg-black/40 p-1 rounded-lg border border-black/5 dark:border-white/5">
            <button 
              onClick={() => setActiveTab("table")} 
              className={`p-1.5 rounded-md transition-all ${displayedTab === "table" ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab("chart")} 
              className={`p-1.5 rounded-md transition-all ${displayedTab === "chart" ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              title="Chart View"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab("split")} 
              className={`hidden lg:inline-flex p-1.5 rounded-md transition-all ${displayedTab === "split" ? "bg-white dark:bg-white/10 text-foreground dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              title="Split View"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>
          
          <div className="hidden sm:block h-6 w-px bg-border/50"></div>
          
          <button 
            onClick={onToggleInsights}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-lg text-sm text-foreground transition-all"
            title="Toggle Insights Panel"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden lg:inline">Insights</span>
          </button>
          
          <button 
            onClick={() => setShowSQLModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-lg text-sm text-foreground transition-all"
          >
            <Code className="w-4 h-4" />
            <span className="hidden md:inline">SQL</span>
          </button>
          
          <button 
            onClick={handlePinToggle}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
              isPinned 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-foreground'
            }`}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            <span className="hidden md:inline">{isPinned ? 'Unpin' : 'Pin'}</span>
          </button>
          
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:inline-flex p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 custom-scrollbar bg-background">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Revenue", value: `$${(data.reduce((acc, row) => acc + (row.revenue || 0), 0) / 1000).toFixed(0)}K`, change: "+14%", type: "positive" },
            { label: "Avg Margin", value: `${(data.reduce((acc, row) => acc + (row.margin || 0), 0) / data.length).toFixed(1)}%`, change: "+2.4%", type: "positive" },
            { label: "Total Units", value: data.reduce((acc, row) => acc + (row.quantity || 0), 0).toLocaleString(), change: "-5%", type: "negative" },
            { label: "Data Points", value: data.length, change: "Live", type: "neutral" },
          ].map((kpi, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (i * 0.05) }}
              key={i} 
              className="bg-card backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 hover:border-border transition-colors shadow-sm"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
              <div className="flex justify-between items-end">
                <span className="text-xl sm:text-2xl font-bold">{kpi.value}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  kpi.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                  kpi.type === 'negative' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {kpi.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart Customization Bar */}
        <div className="pb-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Chart Type Selector */}
            <div className="relative">
              <button
                onClick={() => setShowChartPicker(!showChartPicker)}
                className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl text-sm font-medium hover:border-primary/50 transition-colors"
              >
                {chartType === 'bar' && <BarChart2 className="w-4 h-4" />}
                {chartType === 'line' && <TrendingUp className="w-4 h-4" />}
                {chartType === 'area' && <Activity className="w-4 h-4" />}
                {chartType === 'pie' && <PieChart className="w-4 h-4" />}
                {chartType === 'donut' && <Circle className="w-4 h-4" />}
                {chartType === 'scatter' && <Target className="w-4 h-4" />}
                <span className="capitalize">{chartType}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <AnimatePresence>
                {showChartPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    {chartTypes.map(ct => (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setChartType(ct.id);
                          setActiveTab(ct.id === 'table' ? 'table' : 'chart');
                          setShowChartPicker(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors ${chartType === ct.id ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {ct.id === 'bar' && <BarChart2 className="w-4 h-4" />}
                        {ct.id === 'line' && <TrendingUp className="w-4 h-4" />}
                        {ct.id === 'area' && <Activity className="w-4 h-4" />}
                        {ct.id === 'pie' && <PieChart className="w-4 h-4" />}
                        {ct.id === 'donut' && <Circle className="w-4 h-4" />}
                        {ct.id === 'scatter' && <Target className="w-4 h-4" />}
                        {ct.id === 'table' && <TableIcon className="w-4 h-4" />}
                        {ct.name}
                        {chartType === ct.id && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color Palette Selector */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl text-sm font-medium hover:border-primary/50 transition-colors"
              >
                <div className="flex -space-x-1">
                  {selectedColors.colors.slice(0, 3).map((color, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border-2 border-card" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span>{selectedColors.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl shadow-xl z-20 p-3 w-64"
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-2">Color Palettes</p>
                    <div className="space-y-2">
                      {chartColors.map(palette => (
                        <button
                          key={palette.name}
                          onClick={() => { setSelectedColors(palette); setShowColorPicker(false); }}
                          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${selectedColors.name === palette.name ? 'bg-primary/10' : ''}`}
                        >
                          <div className="flex -space-x-1">
                            {palette.colors.slice(0, 5).map((color, i) => (
                              <div key={i} className="w-5 h-5 rounded-full border-2 border-card" style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          <span className="flex-1 text-left">{palette.name}</span>
                          {selectedColors.name === palette.name && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Data Keys Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl flex-wrap">
              <span className="text-xs text-muted-foreground">Show:</span>
              {availableKeys.map(key => (
                <button
                  key={key}
                    onClick={() => {
                      setSelectedDataKeys(prev => {
                        if (prev.includes(key)) {
                          return prev.length > 1 ? prev.filter(k => k !== key) : prev;
                        }
                        return [...prev, key];
                      });
                    }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedDataKeys.includes(key) 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Layout (Split, Table, Chart) */}
        <div className={`grid gap-4 md:gap-6 flex-1 min-h-[320px] md:min-h-[400px] ${
          displayedTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          
          {/* Table View */}
          {(displayedTab === 'split' || displayedTab === 'table') && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-card dark:bg-card/30 backdrop-blur-sm border border-border/50 dark:border-white/5 rounded-2xl flex flex-col shadow-sm overflow-hidden min-w-0"
            >
              <div className="p-3 sm:p-4 border-b border-border/50 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] gap-2">
                <h3 className="font-medium text-sm flex items-center gap-2 min-w-0">
                  <TableIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Data View</span>
                  <span className="text-xs text-muted-foreground shrink-0">({data.length} rows)</span>
                </h3>
                <button onClick={handleExportCSV} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
              <div className="overflow-x-auto flex-1 p-2 sm:p-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <table className="w-full min-w-[640px] text-sm text-left border-collapse">
                    <thead className="text-xs text-muted-foreground uppercase sticky top-0 z-20">
                      <tr>
                        <th className="px-2 py-3 w-10 bg-black/5 dark:bg-white/5 first:rounded-tl-lg border-r border-border/20"></th>
                        <SortableContext items={columns.map(c => `col-${c}`)} strategy={horizontalListSortingStrategy}>
                          {columns.map(key => (
                            <SortableColumn 
                              key={`col-${key}`} 
                              id={key} 
                              title={key.charAt(0).toUpperCase() + key.slice(1)} 
                            />
                          ))}
                        </SortableContext>
                      </tr>
                    </thead>
                    <SortableContext items={data.map(r => `row-${r.id}`)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {data.map(row => (
                          <SortableRow key={`row-${row.id}`} rowId={row.id} row={row} columns={columns} />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            </motion.div>
          )}

          {/* Chart View */}
          {(displayedTab === 'split' || displayedTab === 'chart') && chartType !== 'table' && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-card dark:bg-card/30 backdrop-blur-sm border border-border/50 dark:border-white/5 rounded-2xl flex flex-col shadow-sm min-w-0"
            >
              <div className="p-3 sm:p-4 border-b border-border/50 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] gap-2">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-secondary" />
                  Visualization
                </h3>
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-end">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded truncate max-w-[80px] sm:max-w-[120px]">X: {xAxisKey}</span>
                   <span className="text-[10px] uppercase font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[200px]">Y: {selectedDataKeys.join(', ')}</span>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6 min-h-[260px] sm:min-h-[320px]">
                <ResponsiveContainer width="100%" height={chartHeight}>
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* SQL Modal */}
      <AnimatePresence>
        {showSQLModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSQLModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card dark:bg-[#1C1C1C] rounded-2xl w-full max-w-2xl overflow-hidden border border-border/50 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50 dark:border-white/5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Generated SQL Query
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button onClick={() => setShowSQLModal(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <pre className="bg-black/5 dark:bg-black/40 p-4 rounded-xl overflow-x-auto text-sm font-mono text-foreground/80">
                  {mockSQL}
                </pre>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Tables queried: products, sales_transactions</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
