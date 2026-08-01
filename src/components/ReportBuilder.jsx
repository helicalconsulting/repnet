import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
const Plot = createPlotlyComponent(Plotly);
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
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
  Sparkles,
  FileSpreadsheet,
  File,
  Box
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ZAxis,
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
  Scatter,
  ComposedChart
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
import { exportApi } from "../services/api";
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

const fallbackSQL = `-- No SQL available for this report.
-- Connect a database and run a query to see generated SQL.`;

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
    <th ref={setNodeRef} style={style} {...attributes} {...listeners} className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium bg-muted dark:bg-muted relative z-10 hover:bg-muted/80 dark:hover:bg-muted/80 touch-none first:rounded-tl-lg last:rounded-tr-lg">
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
              <span className="font-medium truncate block max-w-[140px] sm:max-w-[200px]">
                {value !== null && typeof value === 'object'
                  ? (value.type === 'Point' && Array.isArray(value.coordinates)
                      ? `Point(${value.coordinates.join(', ')})`
                      : JSON.stringify(value))
                  : String(value ?? '')}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

export default function ReportBuilder({ query, onClose, reportData, onToggleInsights, isSidebarOpen, isPreview = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { togglePinReport, saveReport, addNotification, pinnedReports, user } = useApp();
  const isViewer = user?.role === 'viewer';
  
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
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    if (reportData?.isPinned || reportData?.is_pinned) return true;
    if (reportData?.id && pinnedReports) {
      return pinnedReports.some(r => r.id === reportData.id);
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDataKeys, setSelectedDataKeys] = useState(["revenue", "margin"]);
  const [xAxisKey, setXAxisKey] = useState("product");
  const [yAxisKey, setYAxisKey] = useState("margin"); // dedicated Y-axis for scatter chart
  const [zAxisKey, setZAxisKey] = useState("");
  const [secondaryLineKey, setSecondaryLineKey] = useState("");
  const [barMode, setBarMode] = useState("stacked"); // 'stacked' | 'grouped'
  const [isGlassMode, setIsGlassMode] = useState(true); // Stripe/Vercel Glassmorphic Aesthetic Mode

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState(query || "");
  const [saveDescription, setSaveDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDataExportMenu, setShowDataExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeChart: false,
    includeKPIs: false,
    includeTable: true
  });

  const isNewReport = !reportData?.id || String(reportData.id).startsWith('rep-');
  
  // Ensure each row has a stable `__rowId` for drag-and-drop
  const ensureRowIds = (rows) => rows.map((row, idx) => ({
    ...row,
    __rowId: row.id ?? row.__rowId ?? `row-${idx}`,
  }));

  const [data, setData] = useState(() => {
    const raw = reportData?.rows || reportData?.data;
    if (raw) return ensureRowIds(raw);
    return reportData ? [] : ensureRowIds(dummyData);
  });
  const [columns, setColumns] = useState(() => {
    if (reportData?.columns && reportData.columns.length > 0) {
      return reportData.columns.map(c => typeof c === 'string' ? c : c.column_name || c.name || c);
    }
    const initData = reportData?.rows || reportData?.data;
    if (initData) {
      return initData.length > 0 ? Object.keys(initData[0]).filter(k => k !== 'id' && k !== '__rowId') : [];
    }
    return reportData ? [] : Object.keys(dummyData[0]).filter(k => k !== 'id' && k !== '__rowId');
  });
  
  const isIdColumn = (colName) => {
    const lower = String(colName).toLowerCase();
    return lower === 'id' || lower === '__rowid' || lower.endsWith('id') || lower.endsWith('_id') ||
           lower === 'job' || lower === 'orderno' || lower === 'invoiceno' || lower === 'seq' || lower === 'num';
  };

  const availableKeys = useMemo(() => {
    if (!data.length) return [];
    
    // First priority: Numeric columns that are NOT ID/Key columns
    const metricCols = columns.filter(k => 
      !isIdColumn(k) &&
      data.some(row => 
        row[k] !== undefined && 
        row[k] !== null && 
        row[k] !== '' &&
        !isNaN(Number(row[k])) &&
        typeof row[k] !== 'boolean'
      )
    );

    if (metricCols.length > 0) return metricCols;

    // Fallback: All numeric columns
    return columns.filter(k => 
      data.some(row => 
        row[k] !== undefined && 
        row[k] !== null && 
        row[k] !== '' &&
        !isNaN(Number(row[k])) &&
        typeof row[k] !== 'boolean'
      )
    );
  }, [columns, data]);

  // Check if Z-Axis column is numeric
  const zIsNumeric = useMemo(() => {
    if (!zAxisKey || !data.length) return false;
    return data.some(r => typeof r[zAxisKey] === 'number' || (!isNaN(Number(r[zAxisKey])) && r[zAxisKey] !== '' && r[zAxisKey] !== null));
  }, [zAxisKey, data]);

  // Unique values or buckets for Z-Axis
  const zValues = useMemo(() => {
    if (!zAxisKey || !data.length) return [];
    
    const set = new Set();
    data.forEach(r => {
      const val = r[zAxisKey];
      if (val !== undefined && val !== null && val !== '') {
        set.add(String(val));
      }
    });
    const uniqueList = Array.from(set);

    // Only bucket if there are > 15 unique continuous numeric values AND it is NOT an ID column
    if (zIsNumeric && uniqueList.length > 15 && !isIdColumn(zAxisKey) && chartType !== 'scatter') {
      return ["Low", "Medium", "High"];
    }

    return uniqueList.slice(0, 15);
  }, [zAxisKey, data, zIsNumeric, chartType]);

  // Pivot or clean data for chart visualization
  const processedDataForChart = useMemo(() => {
    if (!data.length) return [];

    if (!zAxisKey) {
      return data.map(row => {
        const cleanRow = { ...row };
        availableKeys.forEach(key => {
          if (cleanRow[key] !== undefined && cleanRow[key] !== null) {
            const val = Number(cleanRow[key]);
            cleanRow[key] = isNaN(val) ? 0 : val;
          } else {
            cleanRow[key] = 0;
          }
        });
        return cleanRow;
      });
    }

    const primaryMetric = selectedDataKeys[0] || availableKeys[0] || 'revenue';
    const groupMap = new Map();

    const set = new Set();
    data.forEach(r => {
      const val = r[zAxisKey];
      if (val !== undefined && val !== null && val !== '') {
        set.add(String(val));
      }
    });
    const uniqueList = Array.from(set);
    const useBuckets = zIsNumeric && uniqueList.length > 15 && !isIdColumn(zAxisKey) && chartType !== 'scatter';

    if (useBuckets) {
      // Calculate min, max for numeric bucketization
      const numVals = data.map(r => Number(r[zAxisKey]) || 0);
      const minV = Math.min(...numVals);
      const maxV = Math.max(...numVals);
      const range = (maxV - minV) || 1;

      data.forEach(row => {
        const xVal = String(row[xAxisKey] ?? 'Unknown');
        const numV = Number(row[zAxisKey]) || 0;
        let bucket = "Medium";
        if (numV <= minV + range / 3) bucket = "Low";
        else if (numV >= maxV - range / 3) bucket = "High";

        const val = Number(row[primaryMetric]) || 0;
        if (!groupMap.has(xVal)) {
          groupMap.set(xVal, { [xAxisKey]: xVal });
        }
        const entry = groupMap.get(xVal);
        entry[bucket] = (entry[bucket] || 0) + val;
      });
    } else {
      data.forEach(row => {
        const xVal = String(row[xAxisKey] ?? 'Unknown');
        const zVal = String(row[zAxisKey] ?? 'Other');
        const val = Number(row[primaryMetric]) || 0;

        if (!groupMap.has(xVal)) {
          groupMap.set(xVal, { [xAxisKey]: xVal });
        }
        const entry = groupMap.get(xVal);
        entry[zVal] = (entry[zVal] || 0) + val;
        
        if (secondaryLineKey && row[secondaryLineKey] !== undefined) {
          const lineVal = Number(row[secondaryLineKey]);
          if (!isNaN(lineVal)) {
            entry[secondaryLineKey] = lineVal;
          }
        }
      });
    }

    return Array.from(groupMap.values());
  }, [data, availableKeys, zAxisKey, xAxisKey, selectedDataKeys, zIsNumeric, chartType]);

  // ── Plotly 3D WebGL Chart Data ──────────────────────────────────────────────
  const plotly3DData = useMemo(() => {
    if (!data || !data.length) return [];

    const xCol = xAxisKey;
    const yCol = zAxisKey || (columns.find(c => c !== xAxisKey && !availableKeys.includes(c)) || 'Category');
    const zCol = selectedDataKeys[0] || availableKeys[0] || 'revenue';

    const xVals = [];
    const yVals = [];
    const zVals = [];
    const textVals = [];

    const formatDate = (val) => {
      const str = String(val ?? '');
      if (!str) return '';
      const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [yyyy, mm, dd] = clean.split('-');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${dd} ${months[parseInt(mm, 10) - 1] || mm}`;
      }
      return clean;
    };

    data.forEach(r => {
      const xV = formatDate(r[xCol]);
      const yV = String(r[yCol] ?? 'General');
      const zV = Number(r[zCol]) || 0;

      xVals.push(xV);
      yVals.push(yV);
      zVals.push(zV);
      textVals.push(`${xCol}: ${xV}<br>${yCol}: ${yV}<br>${zCol}: ${zV.toLocaleString()}`);
    });

    return [
      {
        type: 'scatter3d',
        mode: 'markers+lines',
        x: xVals,
        y: yVals,
        z: zVals,
        text: textVals,
        hoverinfo: 'text',
        marker: {
          size: 7,
          color: zVals,
          colorscale: 'Turbo',
          showscale: true,
          colorbar: {
            thickness: 10,
            len: 0.7,
            title: { text: zCol, font: { color: '#888', size: 10 } },
            tickfont: { color: '#888', size: 9 }
          },
          opacity: 0.95
        },
        line: {
          color: 'rgba(99, 102, 241, 0.4)',
          width: 3
        }
      }
    ];
  }, [data, xAxisKey, zAxisKey, selectedDataKeys, availableKeys, columns]);

  const plotly3DLayout = useMemo(() => {
    const yColName = zAxisKey || 'Grouping';
    const zColName = selectedDataKeys[0] || availableKeys[0] || 'Metric';

    return {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 0, r: 0, b: 0, t: 0 },
      scene: {
        xaxis: {
          title: { text: xAxisKey, font: { color: '#94a3b8', size: 11 } },
          gridcolor: 'rgba(255, 255, 255, 0.1)',
          showbackground: true,
          backgroundcolor: 'rgba(15, 23, 42, 0.4)',
          tickfont: { color: '#64748b', size: 9 }
        },
        yaxis: {
          title: { text: yColName, font: { color: '#94a3b8', size: 11 } },
          gridcolor: 'rgba(255, 255, 255, 0.1)',
          showbackground: true,
          backgroundcolor: 'rgba(15, 23, 42, 0.4)',
          tickfont: { color: '#64748b', size: 9 }
        },
        zaxis: {
          title: { text: zColName, font: { color: '#94a3b8', size: 11 } },
          gridcolor: 'rgba(255, 255, 255, 0.1)',
          showbackground: true,
          backgroundcolor: 'rgba(15, 23, 42, 0.4)',
          tickfont: { color: '#64748b', size: 9 }
        },
        camera: {
          eye: { x: 1.6, y: 1.6, z: 1.2 }
        }
      }
    };
  }, [xAxisKey, zAxisKey, selectedDataKeys, availableKeys]);

  const displayedTab = isMobile && activeTab === 'split' ? 'chart' : activeTab;
  const chartHeight = displayedTab === 'split'
    ? (isMobile ? 260 : 320)
    : (isMobile ? 280 : 380);

  // ── Axis initialization: col_meta-driven (production) + data-type fallback ──
  useEffect(() => {
    if (columns.length === 0 || data.length === 0) return;

    const colMeta = reportData?.col_meta || null;

    if (colMeta) {
      // ── PATH A: Backend-computed col_meta (authoritative) ─────────────────
      // Validate each assignment against actual columns before applying
      const has = (col) => col && columns.includes(col);
      const hasNum = (col) => col && availableKeys.includes(col);

      if (has(colMeta.x_axis)) setXAxisKey(colMeta.x_axis);
      if (hasNum(colMeta.y_axis)) {
        setSelectedDataKeys([colMeta.y_axis]);
        setYAxisKey(colMeta.y_axis);
      }
      if (has(colMeta.z_axis)) setZAxisKey(colMeta.z_axis);
      else setZAxisKey('');
      if (hasNum(colMeta.secondary_y)) setSecondaryLineKey(colMeta.secondary_y);
      else if (availableKeys.length > 1) setSecondaryLineKey(availableKeys.find(k => k !== colMeta.y_axis) || availableKeys[1] || '');
      else setSecondaryLineKey('');
      if (colMeta.chart_type) setChartType(colMeta.chart_type);

    } else {
      // ── PATH B: Fallback — data-type analysis only, zero keywords ─────────
      // Numeric (non-boolean, non-blank) → metric candidates
      const numCols = columns.filter(k =>
        k !== '__rowId' && k !== 'id' && !isIdColumn(k) &&
        data.some(row =>
          row[k] !== undefined && row[k] !== null && row[k] !== '' &&
          !isNaN(Number(row[k])) && typeof row[k] !== 'boolean'
        )
      );
      // Date-like strings → date dimension
      const ISO_DATE = /^\d{4}[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])/;
      const MONTH_YEAR = /^\d{4}[-/](0?[1-9]|1[0-2])$/;
      const dateCols = columns.filter(k =>
        !numCols.includes(k) &&
        data.slice(0, 10).some(row => {
          const v = String(row[k] ?? '').trim();
          return ISO_DATE.test(v) || MONTH_YEAR.test(v);
        })
      );
      const nonNumCols = columns.filter(k => !numCols.includes(k));

      // X: date dim > first non-num col > first col
      const bestX = dateCols[0] || nonNumCols[0] || columns[0];
      setXAxisKey(bestX);

      // Y: first numeric col
      setSelectedDataKeys(numCols.length > 0 ? [numCols[0]] : []);
      setYAxisKey(numCols.length > 1 ? numCols[1] : numCols[0] || '');

      // Z: first non-X non-numeric string col with 2–12 unique values
      let bestZ = '';
      for (const col of nonNumCols.filter(c => c !== bestX && !dateCols.includes(c))) {
        const card = new Set(data.map(r => String(r[col] ?? ''))).size;
        if (card >= 2 && card <= 15) { bestZ = col; break; }
      }
      setZAxisKey(bestZ);

      // Secondary Y: second numeric col
      setSecondaryLineKey(numCols.length > 1 ? numCols[1] : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, data, reportData?.col_meta]);

  // Keep all internal states synchronized when reportData or pinnedReports changes
  useEffect(() => {
    if (!reportData) return;

    // 1. Update charting config
    setChartType(reportData.chartType || reportData?.col_meta?.chart_type || "bar");
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

    // 2. Update pinning status
    setIsPinned(reportData.isPinned || reportData.is_pinned || (pinnedReports && pinnedReports.some(r => r.id === reportData.id)) || false);

    // 3. Update report rows and columns
    const rawRows = reportData.rows || reportData.data || [];
    const rawCols = reportData.columns || [];
    if (rawCols.length > 0) {
      setColumns(rawCols.map(c => typeof c === 'string' ? c : c.column_name || c.name || c));
      setData(ensureRowIds(rawRows));
    } else if (rawRows.length > 0) {
      const ensured = ensureRowIds(rawRows);
      setData(ensured);
      setColumns(Object.keys(rawRows[0]).filter(k => k !== 'id' && k !== '__rowId'));
    } else {
      setData([]);
      setColumns([]);
    }

    // 4. Update save name / description
    if (reportData.name) {
      setSaveName(reportData.name);
    }
    if (reportData.description) {
      setSaveDescription(reportData.description);
    }
  }, [reportData, pinnedReports]);

  // Keep saveName synced when query prop changes on new report
  useEffect(() => {
    if (isNewReport && query) {
      setSaveName(query);
    }
  }, [query, isNewReport]);

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
        const oldIndex = data.findIndex(r => `row-${r.__rowId}` === active.id);
        const newIndex = data.findIndex(r => `row-${r.__rowId}` === over.id);
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

  const handlePinToggle = async () => {
    if (isViewer) return;
    if (isNewReport) {
      addNotification('info', 'Please save the report first before pinning it.');
      return;
    }
    try {
      await togglePinReport(reportData.id);
      setIsPinned(!isPinned);
    } catch (err) {
      addNotification('error', err.message || 'Failed to pin/unpin report.');
    }
  };

  const handleSaveReport = async () => {
    if (isViewer) return;
    if (!saveName.trim()) {
      addNotification("error", "Report name is required");
      return;
    }
    setIsSaving(true);
    try {
      const columnsPayload = columns.filter(c => c !== '__rowId').map((colName, idx) => ({
        column_name: colName,
        display_name: colName.charAt(0).toUpperCase() + colName.slice(1),
        position: idx,
        is_visible: true,
        data_type: typeof (data[0]?.[colName]) === 'number' ? 'number' : 'string',
        format_config: {}
      }));

      const newReport = await saveReport({
        name: saveName.trim(),
        description: saveDescription.trim(),
        query_template_id: reportData?.templateId || "sales_overview",
        parameters: {
          ...(reportData?.extractedParams || {}),
          sql: reportData?.sql || "",
          data: data || [],
          summary: reportData?.summary || "",
          col_meta: reportData?.col_meta || null,  // ← persist axis hints for reload
        },
        is_public: false,
        columns: columnsPayload
      });

      setShowSaveModal(false);
      if (newReport?.id) {
        navigate(`/report/${newReport.id}`, { 
          state: { 
            data: { ...newReport, rows: data, sql: reportData?.sql },
            fromChat: location.state?.fromChat,
            sessionId: location.state?.sessionId
          } 
        });
      } else {
        navigate(location.state?.fromChat ? (location.state?.sessionId ? `/chat/${location.state.sessionId}` : '/chat') : '/report');
      }
    } catch (err) {
      addNotification("error", err.message || "Failed to save report");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.length) return;
    const headers = columns.filter(k => k !== '__rowId' && k !== 'id');
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${Date.now()}.csv`;
    a.click();
    addNotification('success', 'CSV exported successfully');
  };

  const getChartImage = async () => {
    try {
      const svgEl = document.querySelector('.recharts-wrapper svg');
      if (!svgEl) return null;

      // Clone the SVG so we can modify its attributes without affecting the live DOM
      const clonedSvg = svgEl.cloneNode(true);
      const width = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 800;
      const height = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 400;
      
      clonedSvg.setAttribute('width', width);
      clonedSvg.setAttribute('height', height);
      clonedSvg.removeAttribute('style');
      clonedSvg.style.width = `${width}px`;
      clonedSvg.style.height = `${height}px`;

      // Helper to inline computed styles from live DOM to the cloned SVG
      const inlineStyles = (source, target) => {
        const computed = window.getComputedStyle(source);
        const tagName = source.tagName.toLowerCase();
        const isContainer = tagName === 'svg' || tagName === 'g';
        
        const properties = [
          'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 
          'fill-opacity', 'stroke-opacity',
          'font-size', 'font-family', 'font-weight', 'text-anchor', 'color',
          'display', 'visibility', 'transform'
        ];
        properties.forEach(prop => {
          // Never inline fill/stroke on container tags (svg/g) to prevent style cascade override of child presentation attributes
          if (isContainer && (prop === 'fill' || prop === 'stroke')) {
            return;
          }
          const val = computed.getPropertyValue(prop);
          if (val) {
            target.style[prop] = val;
          }
        });
        
        for (let i = 0; i < source.children.length; i++) {
          if (target.children[i]) {
            inlineStyles(source.children[i], target.children[i]);
          }
        }
      };

      // Apply computed styles to ensure high-fidelity rendering without relying on external stylesheets or variables
      inlineStyles(svgEl, clonedSvg);

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);
      
      if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
          console.error("Image loading error", err);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    } catch (e) {
      console.error("Failed to serialize chart SVG", e);
      return null;
    }
  };

  const getSummaryContent = () => {
    const mainSummary = reportData?.summary || reportData?.parameters?.summary;
    if (mainSummary) return mainSummary;
    if (reportData?.description) return reportData.description;
    
    const reportName = reportData?.name || saveName || query || 'Analytical Report';
    const numRows = data?.length || 0;
    const colsList = columns?.filter(c => c !== '__rowId' && c !== 'id').join(', ') || '';
    
    return `### Executive Summary: ${reportName}\nAs a senior business intelligence consultant, I have compiled this analytical report presenting a detailed breakdown of the query results. It contains a total of **${numRows} records** structured across the following fields: *${colsList}*.\n\nKey findings can be analyzed in the associated granular data table.`;
  };

  const handleExportExcel = async (options = exportOptions) => {
    if (!data?.length) return;
    setIsExporting(true);
    try {
      const headers = options.includeTable ? columns.filter(k => k !== '__rowId' && k !== 'id') : [];
      const cleanRows = options.includeTable ? data.map(row => {
        const cleanRow = {};
        headers.forEach(h => {
          cleanRow[h] = row[h];
        });
        return cleanRow;
      }) : [];
      
      const summaryText = options.includeSummary ? getSummaryContent() : "";
      const kpisList = []; // KPIs should not be exported per user choice

      const result = await exportApi.exportExcel({
        title: query || "Report",
        headers,
        rows: cleanRows,
        summary: summaryText,
        kpis: kpisList
      }, `report_${Date.now()}.xlsx`);
      
      const url = URL.createObjectURL(result.content);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      addNotification('success', 'Excel exported successfully');
    } catch (err) {
      console.error(err);
      addNotification('error', err.message || 'Excel export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async (options = exportOptions) => {
    if (!data?.length) return;
    setIsExporting(true);
    try {
      const headers = options.includeTable ? columns.filter(k => k !== '__rowId' && k !== 'id') : [];
      const cleanRows = options.includeTable ? data.map(row => {
        const cleanRow = {};
        headers.forEach(h => {
          cleanRow[h] = row[h];
        });
        return cleanRow;
      }) : [];

      const summaryText = options.includeSummary ? getSummaryContent() : "";
      const kpisList = []; // KPIs should not be exported per user choice
      const chartImgBase64 = null; // Charts should not be exported per user choice

      const result = await exportApi.exportPDF({
        title: query || "Report",
        headers,
        rows: cleanRows,
        summary: summaryText,
        chart_image: chartImgBase64,
        kpis: kpisList
      }, `report_${Date.now()}.pdf`);
      
      const url = URL.createObjectURL(result.content);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      addNotification('success', 'PDF exported successfully');
    } catch (err) {
      console.error(err);
      addNotification('error', err.message || 'PDF export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const actualSQL = reportData?.sql || fallbackSQL;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(actualSQL);
    addNotification('success', 'SQL copied to clipboard');
  };


// ── Glassmorphic Custom Tooltip Component (Stripe / Vercel Aesthetic) ─────────
const CustomGlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-card/90 backdrop-blur-xl border border-white/10 dark:border-white/15 p-3 rounded-2xl shadow-2xl space-y-1.5 text-xs z-50">
      <p className="font-semibold text-foreground border-b border-border/40 pb-1">{label}</p>
      {payload.map((entry, index) => {
        const isPct = entry.name?.toLowerCase().includes('margin') || entry.name?.toLowerCase().includes('rate') || entry.name?.toLowerCase().includes('%') || entry.name?.toLowerCase().includes('growth') || entry.name?.toLowerCase().includes('profit');
        return (
          <div key={index} className="flex items-center justify-between gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
            </div>
            <span className="font-semibold text-foreground">
              {typeof entry.value === 'number'
                ? (isPct ? `${entry.value.toFixed(1)}%` : entry.value.toLocaleString())
                : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

  const renderChart = () => {
    const colors = selectedColors.colors;
    const xAxisProps = {
      dataKey: xAxisKey,
      stroke: "var(--muted-foreground)",
      fontSize: isMobile ? 10 : 11,
      tickLine: false,
      axisLine: false,
      tickFormatter: (value) => {
        const str = String(value ?? '');
        if (!str) return '';
        const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          const [yyyy, mm, dd] = clean.split('-');
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const mIdx = parseInt(mm, 10) - 1;
          return `${dd} ${months[mIdx] || mm}`;
        }
        return clean.length > 16 ? clean.slice(0, 14) + '...' : clean;
      },
      angle: isMobile ? -30 : -35,
      textAnchor: "end",
      height: isMobile ? 50 : 60,
      interval: isMobile ? 0 : 'preserveStartEnd'
    };
    const legendProps = { wrapperStyle: { fontSize: isMobile ? 10 : 12, color: 'var(--foreground)' } };

    const formatYAxis = (value) => {
      if (typeof value !== 'number') return value;
      const primaryKey = selectedDataKeys[0] || "";
      const lowerKey = primaryKey.toLowerCase();
      const isCurrency = lowerKey.includes('revenue') || lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('sales') || lowerKey.includes('cost');
      
      let formatted = value;
      if (value >= 1000000) {
        formatted = `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        formatted = `${(value / 1000).toFixed(0)}k`;
      } else {
        formatted = String(value);
      }
      
      return isCurrency ? `$${formatted}` : formatted;
    };
    


    const seriesKeys = zAxisKey && zValues.length > 0 ? zValues : selectedDataKeys;

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={processedDataForChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} 
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Legend {...legendProps} />
            {seriesKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ fill: colors[i % colors.length], r: 4 }} />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart data={processedDataForChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} 
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Legend {...legendProps} />
            {seriesKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} fill={colors[i % colors.length]} fillOpacity={0.3} stroke={colors[i % colors.length]} strokeWidth={2} />
            ))}
          </AreaChart>
        );
      
      case 'pie':
      case 'donut':
        return (
          <RechartsPie>
            <Pie
              data={processedDataForChart}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={isMobile ? false : ({ name, percent }) => `${String(name).split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
              outerRadius={chartType === 'donut' ? 100 : 120}
              innerRadius={chartType === 'donut' ? 60 : 0}
              fill="#8884d8"
              dataKey={selectedDataKeys[0] || (availableKeys[0] || 'revenue')}
              nameKey={xAxisKey}
            >
              {processedDataForChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} 
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Legend {...legendProps} />
          </RechartsPie>
        );
      
      case 'scatter': {
        // X = selectedDataKeys[0] (primary numeric, e.g. revenue / base_price)
        // Y = yAxisKey (dedicated scatter Y, e.g. margin / profit)
        // Z = zAxisKey bubble size (when numeric)
        const scatterXKey = selectedDataKeys[0] || availableKeys[0] || 'revenue';
        const scatterYKey = yAxisKey || availableKeys[1] || availableKeys[0] || 'margin';
        const commonScatterAxes = (
          <>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis
              dataKey={scatterXKey}
              name={scatterXKey}
              stroke="var(--muted-foreground)"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              label={{ value: scatterXKey, position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
            />
            <YAxis
              dataKey={scatterYKey}
              name={scatterYKey}
              stroke="var(--muted-foreground)"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              tickFormatter={formatYAxis}
              label={{ value: scatterYKey, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
            />
          </>
        );
        if (zAxisKey && zValues.length > 0) {
          const isNumericZ = data.some(r => typeof r[zAxisKey] === 'number' || (!isNaN(Number(r[zAxisKey])) && r[zAxisKey] !== '' && r[zAxisKey] !== null));
          if (isNumericZ) {
            return (
              <ScatterChart>
                {commonScatterAxes}
                <ZAxis dataKey={zAxisKey} name={zAxisKey} range={[60, 500]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend {...legendProps} />
                <Scatter name={`Bubble (${zAxisKey} = size)`} data={data} fill={colors[0]} />
              </ScatterChart>
            );
          }
          return (
            <ScatterChart>
              {commonScatterAxes}
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                labelStyle={{ color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend {...legendProps} />
              {zValues.map((zVal, i) => (
                <Scatter key={zVal} name={zVal} data={data.filter(r => String(r[zAxisKey]) === zVal)} fill={colors[i % colors.length]} />
              ))}
            </ScatterChart>
          );
        }
        return (
          <ScatterChart>
            {commonScatterAxes}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Scatter name="Data" data={data} fill={colors[0]} />
          </ScatterChart>
        );
      }
      
      case '3d':
        return (
          <div className="w-full h-full min-h-[360px] relative flex flex-col items-center justify-center">
            <Plot
              data={plotly3DData}
              layout={{
                ...plotly3DLayout,
                autosize: true,
                font: { color: 'var(--foreground)' },
              }}
              useResizeHandler={true}
              className="w-full h-full min-h-[360px]"
              config={{ responsive: true, displayModeBar: true, displaylogo: false }}
            />
          </div>
        );
      
      default: { // bar (with ComposedChart dual Y-axis yellow line support)
        const lineKey = secondaryLineKey || (selectedDataKeys.length > 1 ? selectedDataKeys[1] : null);
        const isPercentLine = lineKey && (
          lineKey.toLowerCase().includes('margin') || 
          lineKey.toLowerCase().includes('rate') || 
          lineKey.toLowerCase().includes('%') || 
          lineKey.toLowerCase().includes('percent') || 
          lineKey.toLowerCase().includes('growth') ||
          lineKey.toLowerCase().includes('profit')
        );

        if (lineKey) {
          const barKeys = zAxisKey && zValues.length > 0 ? zValues : [selectedDataKeys[0] || availableKeys[0] || 'revenue'];
          return (
            <ComposedChart data={processedDataForChart}>
              <defs>
                {colors.map((color, i) => (
                  <linearGradient key={`glassGrad-${i}`} id={`glassGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={isGlassMode ? 0.95 : 1} />
                    <stop offset="100%" stopColor={color} stopOpacity={isGlassMode ? 0.3 : 1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
              <XAxis {...xAxisProps} />
              <YAxis yAxisId="left" orientation="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => typeof v === 'number' ? (isPercentLine ? `${v.toFixed(1)}%` : formatYAxis(v)) : v}
              />
              <Tooltip content={<CustomGlassTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
              <Legend {...legendProps} />
              {barKeys.map((key, i) => (
                <Bar 
                  key={key} 
                  yAxisId="left"
                  dataKey={key} 
                  name={key.charAt(0).toUpperCase() + key.slice(1)} 
                  fill={isGlassMode ? `url(#glassGrad-${i % colors.length})` : colors[i % colors.length]} 
                  stackId={zAxisKey && barMode === 'stacked' ? 'a' : undefined}
                  radius={zAxisKey && barMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 2, 2]} 
                  stroke={isGlassMode ? colors[i % colors.length] : undefined}
                  strokeWidth={isGlassMode ? 1 : 0}
                />
              ))}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={lineKey}
                name={lineKey.charAt(0).toUpperCase() + lineKey.slice(1)}
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 7, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
              />
            </ComposedChart>
          );
        }

        return (
          <BarChart data={processedDataForChart}>
            <defs>
              {colors.map((color, i) => (
                <linearGradient key={`glassGrad-${i}`} id={`glassGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={isGlassMode ? 0.95 : 1} />
                  <stop offset="100%" stopColor={color} stopOpacity={isGlassMode ? 0.3 : 1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
            <Tooltip content={<CustomGlassTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.15 }} />
            <Legend {...legendProps} />
            {seriesKeys.map((key, i) => (
              <Bar 
                key={key} 
                dataKey={key} 
                name={key.charAt(0).toUpperCase() + key.slice(1)} 
                fill={isGlassMode ? `url(#glassGrad-${i % colors.length})` : colors[i % colors.length]} 
                stackId={zAxisKey && barMode === 'stacked' ? 'a' : undefined}
                radius={zAxisKey && barMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 2, 2]} 
                stroke={isGlassMode ? colors[i % colors.length] : undefined}
                strokeWidth={isGlassMode ? 1 : 0}
              />
            ))}
          </BarChart>
        );
      }
    }
  };

  return (
      <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 flex flex-col h-full bg-background overflow-hidden relative z-10 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Dynamic Header */}
      <div className={`min-h-16 border-b border-border/50 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-card/30 backdrop-blur-md sticky top-0 z-10 shrink-0 ${isSidebarOpen === false ? 'pl-14 md:pl-20' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-0 sm:pr-4">
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
          <div className="overflow-hidden min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h2 className="font-semibold text-foreground flex items-center gap-2 truncate text-sm sm:text-base">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span className="truncate">{query}</span>
              </h2>
              {isPreview && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full shrink-0">
                  Preview — new query still running
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Generated from live ERP data • Just now</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          

          
          <button 
            onClick={() => setShowSQLModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-lg text-sm text-foreground transition-all"
          >
            <Code className="w-4 h-4" />
            <span className="hidden md:inline">SQL</span>
          </button>
          
          {!isViewer && (
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
          )}
          
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:inline-flex p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {isNewReport && !isViewer && (
            <button 
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-emerald-600/25 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Save Report</span>
            </button>
          )}

          <button 
            onClick={() => {
              setExportOptions(prev => ({ 
                ...prev, 
                includeSummary: true, 
                includeChart: false, 
                includeKPIs: false, 
                includeTable: true 
              }));
              setShowExportModal(true);
            }}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden md:inline">{isExporting ? "Exporting..." : "Export"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 custom-scrollbar bg-background">

        {/* Chart Customization Bar */}
        <div className="pb-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between">
            {/* View Toggles & Axis Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-card dark:bg-[#1C1C1C] p-1 rounded-xl border border-border/50 dark:border-white/10">
                <button 
                  onClick={() => setActiveTab("table")} 
                  className={`p-1.5 rounded-lg transition-all ${displayedTab === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTab("chart")} 
                  className={`p-1.5 rounded-lg transition-all ${displayedTab === "chart" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Chart View"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTab("split")} 
                  className={`hidden lg:inline-flex p-1.5 rounded-lg transition-all ${displayedTab === "split" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Split View"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              </div>

              {displayedTab !== "table" && (
                <>
                  {/* X Axis — Category / Dimension */}
                  <div className="flex items-center bg-card dark:bg-[#1C1C1C] px-2.5 py-1.5 rounded-xl border border-border/50 dark:border-white/10 text-xs gap-1.5 min-w-0">
                    <span className="font-bold text-muted-foreground text-[10px] uppercase shrink-0">X</span>
                    <select
                      value={xAxisKey}
                      onChange={(e) => setXAxisKey(e.target.value)}
                      className="bg-transparent font-medium outline-none cursor-pointer text-foreground text-xs truncate max-w-[100px]"
                    >
                      {columns.map(col => (
                        <option key={col} value={col} className="bg-card text-foreground">{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Y Axis — Primary Metric */}
                  <div className="flex items-center bg-card dark:bg-[#1C1C1C] px-2.5 py-1.5 rounded-xl border border-border/50 dark:border-white/10 text-xs gap-1.5 min-w-0">
                    <span className="font-bold text-muted-foreground text-[10px] uppercase shrink-0">
                      {chartType === 'scatter' ? 'X₂' : 'Y'}
                    </span>
                    <select
                      value={selectedDataKeys[0] || ''}
                      onChange={(e) => setSelectedDataKeys([e.target.value])}
                      className="bg-transparent font-medium outline-none cursor-pointer text-foreground text-xs truncate max-w-[100px]"
                    >
                      {availableKeys.map(col => (
                        <option key={col} value={col} className="bg-card text-foreground">{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Active badges (only show when non-default values are set) */}
                  {secondaryLineKey && chartType !== 'scatter' && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-500 text-[11px] font-semibold whitespace-nowrap">
                      <span>⟂ Line:</span>
                      <select
                        value={secondaryLineKey}
                        onChange={(e) => setSecondaryLineKey(e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-amber-400 text-[11px] truncate max-w-[80px]"
                      >
                        <option value="" className="bg-card text-foreground">None</option>
                        {availableKeys.map(col => (
                          <option key={col} value={col} className="bg-card text-foreground">{col}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {zAxisKey && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-primary/50 bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap">
                      <span>{chartType === 'scatter' ? '⊚ Bubble:' : '⊞ Split:'}</span>
                      <select
                        value={zAxisKey}
                        onChange={(e) => setZAxisKey(e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-primary text-[11px] truncate max-w-[80px]"
                      >
                        <option value="" className="bg-card text-foreground">None</option>
                        {columns.filter(c => c !== xAxisKey).map(col => (
                          <option key={col} value={col} className="bg-card text-foreground">{col}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stacked / Side-by-Side only when breakdown is active */}
                  {chartType === 'bar' && zAxisKey && (
                    <div className="flex items-center bg-card dark:bg-[#1C1C1C] p-0.5 rounded-xl border border-border/50 dark:border-white/10 text-xs">
                      <button
                        onClick={() => setBarMode('stacked')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          barMode === 'stacked'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Stacked
                      </button>
                      <button
                        onClick={() => setBarMode('grouped')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          barMode === 'grouped'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Grouped
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Customize Chart Drawer Trigger */}
            <AnimatePresence mode="wait">
              {displayedTab !== "table" && (
                <motion.button
                  key="customize-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setShowSettingsDrawer(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl text-xs font-semibold hover:border-primary/50 transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Customize</span>
                </motion.button>
              )}
            </AnimatePresence>
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
                  <button 
                    onClick={() => {
                      setExportOptions(prev => ({ 
                        ...prev, 
                        includeSummary: true, 
                        includeChart: false, 
                        includeKPIs: false, 
                        includeTable: true 
                      }));
                      setShowExportModal(true);
                    }}
                    disabled={isExporting}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-50"
                  >
                    {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                    <span>Export</span>
                  </button>
              </div>
              <div className="flex-1 overflow-auto max-h-[500px]">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={columns.map(c => `col-${c}`)} strategy={horizontalListSortingStrategy}>
                    <SortableContext items={data.map(r => `row-${r.__rowId}`)} strategy={verticalListSortingStrategy}>
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground sticky top-0 bg-card z-20">
                            <th className="px-2 py-2.5 sm:py-3 w-10 text-center font-medium bg-muted dark:bg-muted first:rounded-tl-lg">
                              #
                            </th>
                            {columns.map(col => (
                              <SortableColumn key={`col-${col}`} id={col} title={col} />
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.length > 0 ? (
                            data.map((row) => (
                              <SortableRow key={`row-${row.__rowId}`} rowId={row.__rowId} row={row} columns={columns} />
                            ))
                          ) : (
                            <tr>
                              <td 
                                colSpan={(columns.length || 0) + 1} 
                                className="px-4 py-8 text-center text-muted-foreground font-medium bg-black/[0.01] dark:bg-white/[0.01]"
                              >
                                No records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </SortableContext>
                  </SortableContext>
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
                   {chartType === 'scatter' ? (
                     <>
                       <span className="text-[10px] uppercase font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[200px]">Metric (X): {selectedDataKeys[0]}</span>
                       <span className="text-[10px] uppercase font-bold text-violet-500 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[180px]">Y: {yAxisKey}</span>
                       {zAxisKey && (
                         <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[180px]">Z (size): {zAxisKey}</span>
                       )}
                     </>
                   ) : (
                     <>
                       <span className="text-[10px] uppercase font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[200px]">Y: {selectedDataKeys.join(', ')}</span>
                       {zAxisKey && (
                         <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[180px]">Breakdown: {zAxisKey}</span>
                       )}
                       {secondaryLineKey && (
                         <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-[180px]">Line (Y2): {secondaryLineKey}</span>
                       )}
                     </>
                   )}
                </div>
              </div>

              {/* Breakdown / Bubble Guide Banner */}
              {zAxisKey && chartType !== 'scatter' && (
                <div className="mx-3 sm:mx-4 mt-3 px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-2 text-xs text-indigo-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-indigo-300">📊 3-Column Breakdown:</span>
                    <span>
                      Comparing <strong className="text-foreground">{selectedDataKeys[0] || availableKeys[0] || 'Metric'}</strong> (Y-Axis) across <strong className="text-foreground">{xAxisKey}</strong> (X-Axis), split by <strong className="text-indigo-200">{zAxisKey}</strong> (Breakdown).
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 shrink-0 hidden sm:inline">
                    Mode: <strong>{barMode === 'stacked' ? 'Stacked' : 'Side-by-Side'}</strong>
                  </span>
                </div>
              )}
              {zAxisKey && chartType === 'scatter' && (
                <div className="mx-3 sm:mx-4 mt-3 px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-2 text-xs text-violet-400">
                  <span className="font-bold text-violet-300">🫧 Bubble Chart:</span>
                  <span>
                    X = <strong className="text-foreground">{selectedDataKeys[0] || 'Metric'}</strong> · Y = <strong className="text-violet-200">{yAxisKey}</strong> · Bubble size = <strong className="text-foreground">{zAxisKey}</strong>
                  </span>
                </div>
              )}

              <div className="p-3 sm:p-4 md:p-6 min-h-[260px] sm:min-h-[320px]">
                {chartType === '3d' ? (
                  renderChart()
                ) : (
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    {renderChart()}
                  </ResponsiveContainer>
                )}
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
                  {actualSQL}
                </pre>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Template: {reportData?.templateId || 'N/A'} • {data.length} rows loaded</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Report Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card dark:bg-[#1C1C1C] rounded-2xl w-full max-w-md overflow-hidden border border-border/50 dark:border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50 dark:border-white/5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Save Report
                </h3>
                <button 
                  onClick={() => setShowSaveModal(false)} 
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Name</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="e.g. Sales Q3 Report"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.03] text-sm outline-none focus:border-primary/50 transition-colors"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                  <textarea
                    value={saveDescription}
                    onChange={e => setSaveDescription(e.target.value)}
                    placeholder="Describe what this report analyzes..."
                    className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.03] text-sm outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.01] border-t border-border/50 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReport}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  disabled={isSaving || !saveName.trim()}
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSaving ? "Saving..." : "Save Report"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Customization Drawer */}
      <Drawer open={showSettingsDrawer} onOpenChange={setShowSettingsDrawer}>
        <DrawerContent className="max-w-md mx-auto p-6 bg-card border-border shadow-2xl">
          <DrawerHeader className="px-0 pt-0 text-left">
            <DrawerTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5 text-primary" />
              Chart Customization
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              Adjust chart style, metrics, and axis configurations.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {/* 1. Chart Type */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {chartTypes.filter(ct => ct.id !== 'table').map(ct => {
                  const isActive = chartType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => setChartType(ct.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive 
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                          : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {ct.id === 'bar' && <BarChart2 className="w-5 h-5" />}
                      {ct.id === 'line' && <TrendingUp className="w-5 h-5" />}
                      {ct.id === 'area' && <Activity className="w-5 h-5" />}
                      {ct.id === 'pie' && <PieChart className="w-5 h-5" />}
                      {ct.id === 'donut' && <Circle className="w-5 h-5" />}
                      {ct.id === 'scatter' && <Target className="w-5 h-5" />}
                      {ct.id === '3d' && <Box className="w-5 h-5" />}
                      <span className="text-[10px] font-semibold capitalize truncate w-full text-center">
                        {ct.name.replace(' Chart', '').replace(' Plot', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 2. Color Palette */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Color Palette
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {chartColors.map(palette => {
                  const isActive = selectedColors.name === palette.name;
                  return (
                    <button
                      key={palette.name}
                      onClick={() => setSelectedColors(palette)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-sm transition-all cursor-pointer ${
                        isActive 
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm' 
                          : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        {palette.colors.slice(0, 3).map((color, i) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-full border border-card" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <span className="text-xs truncate">{palette.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 3. Metrics/Columns */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Metrics to Plot (Y-Axis)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableKeys.length > 0 ? (
                  availableKeys.map(key => {
                    const isActive = selectedDataKeys.includes(key);
                    return (
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          isActive 
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                            : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">No metrics found</span>
                )}
              </div>
            </div>
            
            {/* 4. X-Axis Column */}
            {columns.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  X-Axis Column
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {columns.map(key => {
                    const isActive = xAxisKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setXAxisKey(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          isActive 
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                            : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Z-Axis (Grouping / Breakdown) */}
            {columns.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block flex items-center justify-between">
                  <span>Z-Axis (Grouping / Breakdown)</span>
                  <span className="text-[10px] text-primary lowercase font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  <button
                    onClick={() => setZAxisKey("")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      !zAxisKey 
                        ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                        : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    None
                  </button>
                  {columns.filter(k => k !== xAxisKey).map(key => {
                    const isActive = zAxisKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setZAxisKey(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          isActive 
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                            : 'border-border/50 bg-black/5 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Export Options Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card dark:bg-[#1C1C1C] rounded-2xl w-full max-w-md overflow-hidden border border-border/50 dark:border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border/50 dark:border-white/5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export Options
                </h3>
                <button 
                  onClick={() => setShowExportModal(false)} 
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Format selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</label>
                  <div className="grid grid-cols-3 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {["pdf", "excel", "csv"].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setExportFormat(f);
                          if (f === 'csv') {
                            setExportOptions(prev => ({ ...prev, includeSummary: false, includeChart: false, includeKPIs: false, includeTable: true }));
                          } else {
                            setExportOptions(prev => ({ ...prev, includeSummary: true, includeChart: false, includeKPIs: false, includeTable: true }));
                          }
                        }}
                        className={`py-1.5 text-xs font-semibold rounded-lg uppercase transition-all ${
                          exportFormat === f 
                            ? 'bg-card text-foreground shadow-sm border border-border/50' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options List */}
                {exportFormat !== 'csv' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Include Sections</label>
                    
                    <label className="flex items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 rounded-xl cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={exportOptions.includeSummary} 
                        onChange={e => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary text-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">AI Report Summary</span>
                        <span className="text-[10px] text-muted-foreground">
                          {reportData?.summary 
                            ? "Executive summary and parsed insights" 
                            : "Include auto-generated overview summary"
                          }
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 rounded-xl cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={exportOptions.includeTable} 
                        onChange={e => setExportOptions(prev => ({ ...prev, includeTable: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary text-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Data Table Rows</span>
                        <span className="text-[10px] text-muted-foreground">Complete tabular list of results</span>
                      </div>
                    </label>
                  </div>
                )}
                
                {exportFormat === 'csv' && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">
                      CSV format does not support charts or summary formatting. It will export only the raw tabular data rows.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.01] border-t border-border/50 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (exportFormat === 'pdf') {
                      await handleExportPDF(exportOptions);
                    } else if (exportFormat === 'excel') {
                      await handleExportExcel(exportOptions);
                    } else {
                      handleExportCSV();
                    }
                    setShowExportModal(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  disabled={isExporting || (exportFormat !== 'csv' && !exportOptions.includeSummary && !exportOptions.includeChart && !exportOptions.includeKPIs && !exportOptions.includeTable)}
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExporting ? "Generating..." : "Download"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
