import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  BarChart3, Plus, Search, Loader2, Trash2, Play,
  Calendar, Database, FileText, AlertCircle, RefreshCw, CheckSquare, Square, Download, X
} from 'lucide-react';
import { reportApi, exportApi } from '../services/api';
import { useApp } from '../context/AppContext';

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
          <div className="flex items-center gap-2">
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
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Refresh"
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
        )
      });
    }
  }, [setHeaderConfig, reports.length, filtered.length, selectedIds.length, isViewer]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-auto relative">
      <div className="flex-1 p-6 pb-24">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/50 bg-black/[0.02] dark:bg-white/[0.03] text-sm outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* States */}
        {/* States */}
        <SmartSkeleton loading={loading}>
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
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={fetchReports}
                className="text-xs text-primary hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground mb-1">
                  {search ? 'No reports match your search' : 'No reports yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {search ? 'Try a different search term.' : 'Run an AI chat query and save the results as a report.'}
                </p>
              </div>
              {!search && !isViewer && (
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/15 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Start a new chat
                </button>
              )}
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
                      className={`group relative cursor-pointer rounded-2xl border bg-card transition-all p-5 flex flex-col gap-3 ${
                        isSelected 
                          ? 'border-primary shadow-md shadow-primary/5 bg-primary/[0.02]' 
                          : 'border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                      }`}
                    >
                      {/* Header: Icon + Checkbox + Name */}
                      <div className="flex items-start gap-3">
                        {!isViewer && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds(prev =>
                                isSelected ? prev.filter(id => id !== report.id) : [...prev, report.id]
                              );
                            }}
                            className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all cursor-pointer shrink-0 z-20 relative"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
                              {report.name}
                            </h3>
                            {report.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pl-[36px]">
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
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Open Report
                        </button>
                        {!isViewer && (
                          <button
                            onClick={(e) => handleDelete(e, report.id)}
                            disabled={deletingId === report.id}
                            className="p-2 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
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
        </SmartSkeleton>
      </div>

      {/* Floating Action Bar */}
      {!isViewer && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/95 dark:bg-zinc-900/95 backdrop-blur border border-border/80 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-6 max-w-lg w-[calc(100%-2rem)]">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-foreground">{selectedIds.length} report{selectedIds.length !== 1 ? 's' : ''} selected</p>
            <p className="text-[11px] text-muted-foreground">Export latest snapshot results</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkExportFormat('excel');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
            >
              Excel
            </button>
            <button
              onClick={() => {
                setBulkExportFormat('pdf');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
            >
              PDF
            </button>
            <button
              onClick={() => {
                setBulkExportFormat('zip');
                setBulkExportOptions({ includeSummary: true, includeTable: true });
                setShowBulkExportModal(true);
              }}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
            >
              ZIP
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-muted/40 hover:bg-muted text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
