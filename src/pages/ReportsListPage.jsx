import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Plus, Search, Loader2, Trash2, Play,
  Calendar, Database, FileText, AlertCircle, RefreshCw
} from 'lucide-react';
import { reportApi } from '../services/api';

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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reports.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-5 flex items-center justify-between gap-4 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Reports</h1>
            <p className="text-xs text-muted-foreground">
              {reports.length} saved report{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="p-2 rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
                onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground rounded-xl text-sm font-semibold shadow-md shadow-primary/25 hover:from-primary/90 hover:to-blue-600/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">Loading reports...</p>
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
            {!search && (
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
              {filtered.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/report/${report.id}`)}
                  className="group relative cursor-pointer rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all p-5 flex flex-col gap-3"
                >
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3">
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

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
