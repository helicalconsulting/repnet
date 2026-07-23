import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Terminal, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const STATUS_CONFIG = {
  success:      { label: 'Success',      cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  error:        { label: 'Error',        cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  rate_limited: { label: 'Rate Limited', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || 'Unknown', cls: 'bg-muted text-muted-foreground border-border' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>;
}

function QueryRow({ q }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap font-medium">
          {q.created_at ? new Date(q.created_at).toLocaleString() : '—'}
        </td>
        <td className="px-4 py-3 text-foreground font-semibold text-xs whitespace-nowrap">{q.org_name}</td>
        <td className="px-4 py-3 text-foreground text-xs whitespace-nowrap">{q.user_email}</td>
        <td className="px-4 py-3 max-w-sm">
          <p className="text-foreground text-xs font-medium truncate">{q.natural_language_input}</p>
        </td>
        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={q.execution_status} /></td>
        <td className="px-4 py-3 text-right text-foreground font-mono text-xs whitespace-nowrap">{q.rows_returned ?? '—'}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          {q.execution_time_ms ? (
            <span className={`text-xs font-mono font-semibold ${q.execution_time_ms > 5000 ? 'text-rose-500' : q.execution_time_ms > 2000 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {q.execution_time_ms}ms
            </span>
          ) : <span className="text-muted-foreground text-xs">—</span>}
        </td>
        <td className="px-4 py-3 text-right">
          {expanded ? <ChevronUp className="w-4 h-4 text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={8} className="bg-muted/40 border-b border-border px-6 py-4">
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.generated_sql && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Generated SQL Query</span>
                      </div>
                      <pre className="text-xs text-emerald-400 bg-zinc-950 dark:bg-black rounded-xl p-3.5 overflow-x-auto max-h-48 font-mono border border-border">
                        {q.generated_sql}
                      </pre>
                    </div>
                  )}
                  {q.error_message && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Execution Error</span>
                      </div>
                      <pre className="text-xs text-rose-400 bg-zinc-950 dark:bg-black rounded-xl p-3.5 overflow-x-auto max-h-48 font-mono border border-border">
                        {q.error_message}
                      </pre>
                    </div>
                  )}
                  {q.intent && Object.keys(q.intent).length > 0 && (
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Terminal className="w-3.5 h-3.5 text-foreground" />
                        <span>Parsed Intent & Metadata</span>
                      </div>
                      <pre className="text-xs text-foreground bg-card border border-border rounded-xl p-3.5 overflow-x-auto max-h-36 font-mono">
                        {JSON.stringify(q.intent, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function SuperAdminQueryExplorer() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [filters, setFilters] = useState({
    search: '', status: '', from_date: '', to_date: '', min_ms: 0,
  });
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await adminApi.getQueryHistory({ ...filters, skip, limit });
      setData(res);
    } finally { setLoading(false); }
  }, [filters, page, limit]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setPage(1); // Reset page on filter change
    if (key === 'search') {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => setFilters(f => ({ ...f, search: value })), 350);
    } else {
      setFilters(f => ({ ...f, [key]: value }));
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, data?.total || 0);

  return (
    <div className="p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Query Explorer</h1>
          <p className="text-foreground text-sm font-medium mt-0.5">
            <span className="font-bold text-foreground">{data.total || 0}</span> queries found across platform
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-sm text-foreground transition-colors font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-xs">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search natural language queries..."
            onChange={e => setFilter('search', e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
          />
        </div>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs">
          <option value="">All Statuses</option>
          <option value="success">Success Only</option>
          <option value="error">Error Only</option>
          <option value="rate_limited">Rate Limited</option>
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilter('from_date', e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs" />
        <input type="date" value={filters.to_date} onChange={e => setFilter('to_date', e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Time</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Natural Language Query</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Rows</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-foreground font-medium">No queries found matching the selected filters</td></tr>
            ) : (
              data.items.map((q) => <QueryRow key={q.id} q={q} />)
            )}
          </tbody>
        </table>

        {/* Backend Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-border bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 text-xs font-medium text-foreground">
            <span>
              Showing <strong className="text-foreground">{data.total > 0 ? startItem : 0}</strong> to <strong className="text-foreground">{endItem}</strong> of <strong className="text-foreground">{data.total}</strong> queries
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-muted-foreground">Per page:</span>
              <select
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground font-semibold outline-none"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-xs font-semibold text-foreground disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-semibold px-2 text-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-xs font-semibold text-foreground disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
