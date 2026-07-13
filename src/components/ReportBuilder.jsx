import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  File
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
    includeChart: true,
    includeKPIs: true,
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
  
  const availableKeys = columns.filter(k => 
    data.length > 0 && 
    data.some(row => 
      row[k] !== undefined && 
      row[k] !== null && 
      row[k] !== '' &&
      !isNaN(Number(row[k])) &&
      typeof row[k] !== 'boolean'
    )
  );

  const processedDataForChart = data.map(row => {
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

  const displayedTab = isMobile && activeTab === 'split' ? 'chart' : activeTab;
  const chartHeight = displayedTab === 'split'
    ? (isMobile ? 260 : 320)
    : (isMobile ? 280 : 380);

  useEffect(() => {
    if (columns.length > 0 && data.length > 0) {
      const numCols = columns.filter(k => 
        data.some(row => 
          row[k] !== undefined && 
          row[k] !== null && 
          row[k] !== '' &&
          !isNaN(Number(row[k])) &&
          typeof row[k] !== 'boolean'
        )
      );
      setSelectedDataKeys(prev => {
        const active = prev.filter(p => numCols.includes(p));
        active.sort((a, b) => numCols.indexOf(a) - numCols.indexOf(b));
        return active.length ? active : (numCols.length > 0 ? [numCols[0]] : []);
      });
      
      const nonNumCols = columns.filter(k => !numCols.includes(k));
      if (nonNumCols.length > 0) {
        setXAxisKey(nonNumCols[0]);
      } else if (columns.length > 0) {
        setXAxisKey(columns[0]);
      }
    }
  }, [columns, data]);

  // Keep all internal states synchronized when reportData or pinnedReports changes
  useEffect(() => {
    if (!reportData) return;

    // 1. Update charting config
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
    if (reportData?.summary) return reportData.summary;
    if (reportData?.description) return reportData.description;
    
    const reportName = reportData?.name || saveName || query || 'Analytical Report';
    const numRows = data?.length || 0;
    const colsList = columns?.filter(c => c !== '__rowId' && c !== 'id').join(', ') || '';
    
    return `### Executive Summary: ${reportName}\nThis analytical report presents a detailed breakdown of the query results. It contains a total of **${numRows} records** structured across the following fields: *${colsList}*.\n\nKey findings can be visualized in the chart below and the associated granular data table.`;
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
      const kpisList = options.includeKPIs ? getDynamicKPIs() : [];

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
      const kpisList = options.includeKPIs ? getDynamicKPIs() : [];
      
      let chartImgBase64 = null;
      if (options.includeChart && chartType !== 'table') {
        chartImgBase64 = await getChartImage();
      }

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

  const getDynamicKPIs = () => {
    if (!data || data.length === 0) {
      return [
        { label: "Data Points", value: 0, change: "Live", type: "neutral" },
        { label: "Columns", value: columns.length, change: "Meta", type: "neutral" }
      ];
    }

    const kpis = [];

    // Add up to 3 numeric KPIs dynamically based on availableKeys
    availableKeys.slice(0, 3).forEach(col => {
      const sum = data.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
      const avg = sum / data.length;
      
      const lowerCol = col.toLowerCase();
      const isPercentage = lowerCol.includes('margin') || lowerCol.includes('rate') || lowerCol.includes('percent') || lowerCol.includes('pct') || (avg < 1.0 && avg > 0 && !lowerCol.includes('price') && !lowerCol.includes('cost'));
      const isCurrency = lowerCol.includes('revenue') || lowerCol.includes('amount') || lowerCol.includes('price') || lowerCol.includes('sales') || lowerCol.includes('cost');
      
      let formattedValue = "";
      let label = "";

      if (isPercentage) {
        formattedValue = `${(avg * (avg <= 1 && avg > 0 ? 100 : 1)).toFixed(1)}%`;
        label = `Avg ${col.charAt(0).toUpperCase() + col.slice(1)}`;
      } else if (isCurrency) {
        if (sum >= 1000000) {
          formattedValue = `$${(sum / 1000000).toFixed(1)}M`;
        } else if (sum >= 1000) {
          formattedValue = `$${(sum / 1000).toFixed(0)}K`;
        } else {
          formattedValue = `$${sum.toLocaleString()}`;
        }
        label = `Total ${col.charAt(0).toUpperCase() + col.slice(1)}`;
      } else {
        const isSumPreferable = lowerCol.includes('quantity') || lowerCol.includes('unit') || lowerCol.includes('count') || lowerCol.includes('volume') || lowerCol.includes('qty');
        if (isSumPreferable) {
          formattedValue = sum >= 1000000 ? `${(sum / 1000000).toFixed(1)}M` : (sum >= 1000 ? `${(sum / 1000).toFixed(0)}K` : sum.toLocaleString());
          label = `Total ${col.charAt(0).toUpperCase() + col.slice(1)}`;
        } else {
          formattedValue = avg >= 1000 ? `${(avg / 1000).toFixed(0)}K` : (avg % 1 === 0 ? String(avg) : avg.toFixed(1));
          label = `Avg ${col.charAt(0).toUpperCase() + col.slice(1)}`;
        }
      }

      kpis.push({
        label: label,
        value: formattedValue,
        change: "Active",
        type: "positive"
      });
    });

    // Add general count metrics to pad/fill up to 4 cards
    kpis.push({
      label: "Total Data Points",
      value: data.length.toLocaleString(),
      change: "Live",
      type: "neutral"
    });

    if (kpis.length < 4) {
      kpis.push({
        label: "Total Columns",
        value: columns.length,
        change: "Schema",
        type: "neutral"
      });
    }

    return kpis;
  };

  const renderChart = () => {
    const colors = selectedColors.colors;
    const xAxisProps = {
      dataKey: xAxisKey,
      stroke: "var(--muted-foreground)",
      fontSize: isMobile ? 10 : 11,
      tickLine: false,
      axisLine: false,
      tickFormatter: (value) => String(value).split(' ')[0],
      angle: isMobile ? -30 : -45,
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
            {selectedDataKeys.map((key, i) => (
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
      
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis dataKey={selectedDataKeys[0] || (availableKeys[0] || 'revenue')} name={selectedDataKeys[0] || (availableKeys[0] || 'revenue')} stroke="var(--muted-foreground)" fontSize={isMobile ? 10 : 12} tickLine={false} />
            <YAxis dataKey={selectedDataKeys[1] || (availableKeys[1] || 'margin')} name={selectedDataKeys[1] || (availableKeys[1] || 'margin')} stroke="var(--muted-foreground)" fontSize={isMobile ? 10 : 12} tickLine={false} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} 
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Scatter name="Data" data={processedDataForChart} fill={colors[0]} />
          </ScatterChart>
        );
      
      default: // bar
        return (
          <BarChart data={processedDataForChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }} 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} 
              labelStyle={{ color: 'var(--foreground)' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
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
                includeChart: chartType !== 'table', 
                includeKPIs: true, 
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
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {getDynamicKPIs().map((kpi, i) => (
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
            {/* View Toggles */}
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
            {/* Customize Chart Button (Drawer Trigger) */}
            <AnimatePresence mode="wait">
              {displayedTab !== "table" && (
                <motion.button
                  key="customize-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setShowSettingsDrawer(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-[#1C1C1C] border border-border/50 dark:border-white/10 rounded-xl text-sm font-semibold hover:border-primary/50 transition-colors shadow-sm cursor-pointer animate-pulse"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Customize Chart</span>
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
                        includeChart: chartType !== 'table', 
                        includeKPIs: true, 
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
                    <SortableContext items={data.map(r => `row-${r.__rowId}`)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {data.length > 0 ? (
                          data.map(row => (
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
                            setExportOptions(prev => ({ ...prev, includeSummary: true, includeChart: chartType !== 'table', includeKPIs: true, includeTable: true }));
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
                        checked={exportOptions.includeKPIs} 
                        onChange={e => setExportOptions(prev => ({ ...prev, includeKPIs: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary text-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Key Metrics (KPIs)</span>
                        <span className="text-[10px] text-muted-foreground">Total records, average values, currency calculations</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-xl select-none transition-colors ${
                      chartType === 'table' 
                        ? 'bg-black/[0.01] dark:bg-white/[0.01] border-border/30 opacity-50 cursor-not-allowed' 
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-border/50 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={exportOptions.includeChart && chartType !== 'table'} 
                        disabled={chartType === 'table'}
                        onChange={e => setExportOptions(prev => ({ ...prev, includeChart: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary text-primary disabled:opacity-50"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Visualization Chart</span>
                        <span className="text-[10px] text-muted-foreground">
                          {chartType !== 'table' 
                            ? `High-quality render of the active ${chartType} chart` 
                            : "Select a visual chart style (Bar/Line/Pie) to include a snapshot"
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
