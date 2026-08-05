import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Plus, Search, Loader2, Trash2, Play,
  Calendar, Database, FileText, AlertCircle, RefreshCw, CheckSquare, Square, Download, X, MoreHorizontal,
  FileSpreadsheet, FileArchive
} from 'lucide-react';
import { reportApi, exportApi } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { EmptyState, PageFrame, PageLead, StatusPill } from '../components/ui/product-ui';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReportsListPage() {
  const navigate = useNavigate();
  const { activeConnection, connections, user } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  const isViewer = user?.role === 'viewer';

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showBulkExportModal, setShowBulkExportModal] = useState(false);
  const [bulkExportFormat, setBulkExportFormat] = useState("excel");
  const [bulkExportOptions, setBulkExportOptions] = useState({
    includeSummary: true,
    includeTable: true
  });

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportApi.getReports();
      setReports(data);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this report?')) return;
    setDeletingId(id);
    try {
      await reportApi.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkExport = async (format, options = bulkExportOptions) => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try {
      const result = await exportApi.exportBulk({
        reportIds: selectedIds,
        format,
        connectionId: activeConnection?.id,
        includeSummary: options.includeSummary,
        includeTable: options.includeTable
      });
      
      if (result) {
        const url = window.URL.createObjectURL(result.content);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      setSelectedIds([]);
      setShowBulkExportModal(false);
    } catch (err) {
      alert('Failed to export reports: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = reports.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const { setHeaderConfig } = useOutletContext() || {};

  useEffect(() => {
    if (setHeaderConfig) {
      setHeaderConfig({
        title: "Reports",
        subtitle: `${reports.length} saved report${reports.length !== 1 ? 's' : ''}`,
        icon: <BarChart3 className="w-4 h-4 text-foreground" />,
        actions: (
          <>
            <div className="hidden sm:flex items-center gap-2">
              {!isViewer && filtered.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedIds.length === filtered.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(filtered.map(r => r.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {selectedIds.length === filtered.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              <button
                onClick={fetchReports}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Refresh reports"
                title="Refresh reports"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {!isViewer && (
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Report
                </button>
              )}
            </div>

            <div className="flex sm:hidden items-center gap-1">
              {!isViewer && (
                <button
                  onClick={() => navigate('/chat')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 shadow-sm"
                  aria-label="Create new report"
                  title="Create new report"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
                    aria-label="More report actions"
                    title="More report actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {!isViewer && filtered.length > 0 && (
                    <DropdownMenuItem
                      onSelect={() => {
                        if (selectedIds.length === filtered.length) {
                          setSelectedIds([]);
                        } else {
                          setSelectedIds(filtered.map(r => r.id));
                        }
                      }}
                    >
                      {selectedIds.length === filtered.length ? <Square /> : <CheckSquare />}
                      {selectedIds.length === filtered.length ? 'Deselect all' : 'Select all'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={fetchReports}>
                    <RefreshCw />
                    Refresh reports
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )
      });
    }
  }, [setHeaderConfig, reports.length, filtered.length, selectedIds.length, isViewer]);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-auto">
      <PageFrame className="flex-1 pb-28">
        <PageLead
          title="Saved reports"
          description="Search, open and export the reports your team has already created."
          actions={selectedIds.length > 0 ? (
            <StatusPill tone="primary">{selectedIds.length} selected</StatusPill>
          ) : (
            <StatusPill>{filtered.length} visible</StatusPill>
          )}
        />

        {/* Search */}
        <div className="app-surface relative mb-6 max-w-xl rounded-2xl p-2">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-transparent bg-muted/50 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/75 focus:border-primary/25 focus:bg-card focus:ring-4 focus:ring-primary/8"
          />
        </div>

        {/* States */}
        {/* States */}
        <div aria-busy={loading}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded w-1/4 pl-[36px]" />
                  <div className="h-8 bg-muted rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="app-card rounded-2xl">
              <EmptyState
                icon={AlertCircle}
                title="Reports could not be loaded"
                description={error}
                action={(
                  <button onClick={fetchReports} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    Try again
                  </button>
                )}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="app-card rounded-2xl">
              <EmptyState
                icon={FileText}
                title={search ? 'No reports match your search' : 'No reports yet'}
                description={search ? 'Try a different search term.' : 'Ask Repnex a question and save the result as a report.'}
                action={!search && !isViewer ? (
                  <button
                    onClick={() => navigate('/chat')}
                    className="brand-gradient flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Start an analysis
                  </button>
                ) : null}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((report, i) => {
                  const isSelected = selectedIds.includes(report.id);
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/report/${report.id}`)}
                      className={`interactive-card group relative flex cursor-pointer flex-col gap-4 rounded-2xl border bg-card/95 p-5 ${
                        isSelected 
                          ? 'border-primary/60 bg-primary/[0.035] shadow-md shadow-primary/5' 
                          : 'border-border/80 shadow-sm'
                      }`}
                    >
                      {/* Header: Icon + Checkbox + Name */}
                      <div className="flex items-start gap-3">
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds(prev =>
                                isSelected ? prev.filter(id => id !== report.id) : [...prev, report.id]
                              );
                            }}
                            aria-label={`${isSelected ? 'Deselect' : 'Select'} ${report.name}`}
                            aria-pressed={isSelected}
                            className="relative z-20 -ml-1.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                            )}
                          </button>
                        )}
                        
                        <div className="flex-1 min-w-0 flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/8">
                            <BarChart3 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
                              {report.name}
                            </h3>
                            {(() => {
                              const rawDesc = report.description || report.parameters?.summary || report.parameters?.natural_language || (report.parameters?.sql ? `SQL: ${report.parameters.sql}` : '');
                              if (!rawDesc) return null;
                              const cleanDesc = String(rawDesc).replace(/[#*`_-]/g, '').trim();
                              return (
                                <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                                  {cleanDesc}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-border/55 pt-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {timeAgo(report.created_at)}
                        </span>
                        {report.query_template_id && (
                          <span className="flex items-center gap-1 truncate">
                            <Database className="w-3 h-3 shrink-0" />
                            <span className="truncate">{report.query_template_id}</span>
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => navigate(`/report/${report.id}`)}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/15 transition-colors hover:bg-primary-hover"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Open Report
                        </button>
                        {!isViewer && (
                          <button
                            onClick={(e) => handleDelete(e, report.id)}
                            disabled={deletingId === report.id}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
                            aria-label={`Delete ${report.name}`}
                          >
                            {deletingId === report.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PageFrame>

      {/* Floating Action Bar */}
      <AnimatePresence>
      {!isViewer && selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="region"
          aria-label="Selected report actions"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-2xl border border-primary/25 bg-card/95 p-3 shadow-2xl shadow-primary/20 ring-1 ring-primary/10 backdrop-blur-2xl sm:bottom-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <CheckSquare className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Export selected reports</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {selectedIds.length} report{selectedIds.length !== 1 ? 's' : ''} selected · Choose a format
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center">
            <button
              onClick={() => {
                setBulkExportFormat('excel');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => {
                setBulkExportFormat('pdf');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => {
                setBulkExportFormat('zip');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
            >
              <FileArchive className="h-4 w-4" />
              ZIP
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={isExporting}
              aria-label="Clear report selection"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkExportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  <span className="font-bold text-foreground">Bulk Export Options</span>
                </div>
                <button 
                  onClick={() => setShowBulkExportModal(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Format selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</label>
                  <div className="grid grid-cols-3 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {["excel", "pdf", "zip"].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setBulkExportFormat(f);
                        }}
                        className={`py-1.5 text-xs font-semibold rounded-lg uppercase transition-all ${
                          bulkExportFormat === f 
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Include Sections</label>
                  
                  <label className="flex items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 rounded-xl cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={bulkExportOptions.includeSummary} 
                      onChange={e => setBulkExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">AI Report Summary</span>
                      <span className="text-[10px] text-muted-foreground">
                        Include executive summary and parsed insights for each report
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-border/50 rounded-xl cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors select-none">
                    <input 
                      type="checkbox" 
                      checked={bulkExportOptions.includeTable} 
                      onChange={e => setBulkExportOptions(prev => ({ ...prev, includeTable: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Data Table Rows</span>
                      <span className="text-[10px] text-muted-foreground">Complete tabular list of results for each report</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.01] border-t border-border/50 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowBulkExportModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleBulkExport(bulkExportFormat, bulkExportOptions);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  disabled={isExporting || (!bulkExportOptions.includeSummary && !bulkExportOptions.includeTable)}
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExporting ? "Exporting..." : `Export ${selectedIds.length} Reports`}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
