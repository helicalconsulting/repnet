import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, ChevronDown, ChevronUp, XCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const STATUS_CONFIG = {
  success:      { label: 'Success',      cls: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30' },
  error:        { label: 'Error',        cls: 'bg-rose-600/20 text-rose-300 border-rose-600/30' },
  rate_limited: { label: 'Rate Limited', cls: 'bg-amber-600/20 text-amber-300 border-amber-600/30' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-slate-700/50 text-slate-400 border-slate-600/30' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>;
}

function QueryRow({ q }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
          {q.created_at ? new Date(q.created_at).toLocaleString() : '—'}
        </td>
        <td className="px-4 py-3 text-slate-300 text-xs">{q.org_name}</td>
        <td className="px-4 py-3 text-slate-400 text-xs">{q.user_email}</td>
        <td className="px-4 py-3 max-w-xs">
          <p className="text-slate-200 text-sm truncate">{q.natural_language_input}</p>
        </td>
        <td className="px-4 py-3"><StatusBadge status={q.execution_status} /></td>
        <td className="px-4 py-3 text-right text-slate-400 text-xs">{q.rows_returned ?? '—'}</td>
        <td className="px-4 py-3 text-right">
          {q.execution_time_ms ? (
            <span className={`text-xs font-mono ${q.execution_time_ms > 5000 ? 'text-rose-400' : q.execution_time_ms > 2000 ? 'text-amber-400' : 'text-slate-300'}`}>
              {q.execution_time_ms}ms
            </span>
          ) : <span className="text-slate-500 text-xs">—</span>}
        </td>
        <td className="px-4 py-3">
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={8} className="bg-slate-800/30 border-b border-slate-800/50 px-4 py-4">
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.generated_sql && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Generated SQL</p>
                      <pre className="text-xs text-emerald-300 bg-slate-900 rounded-xl p-3 overflow-auto max-h-40 font-mono">{q.generated_sql}</pre>
                    </div>
                  )}
                  {q.error_message && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Error</p>
                      <pre className="text-xs text-rose-300 bg-slate-900 rounded-xl p-3 overflow-auto max-h-40 font-mono">{q.error_message}</pre>
                    </div>
                  )}
                  {q.intent && Object.keys(q.intent).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Intent</p>
                      <pre className="text-xs text-slate-300 bg-slate-900 rounded-xl p-3 overflow-auto max-h-40 font-mono">{JSON.stringify(q.intent, null, 2)}</pre>
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
  const [filters, setFilters] = useState({
    search: '', status: '', from_date: '', to_date: '', min_ms: 0,
  });
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getQueryHistory(filters);
      setData(res);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    if (key === 'search') {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => setFilters(f => ({ ...f, search: value })), 400);
    } else {
      setFilters(f => ({ ...f, [key]: value }));
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Query Explorer</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data.total} queries found</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            placeholder="Search natural language input..."
            onChange={e => setFilter('search', e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-500"
          />
        </div>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="rate_limited">Rate Limited</option>
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilter('from_date', e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500" />
        <input type="date" value={filters.to_date} onChange={e => setFilter('to_date', e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500" />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Org</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Query</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rows</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No queries found matching filters</td></tr>
            ) : (
              data.items.map((q) => <QueryRow key={q.id} q={q} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
