import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, AlertOctagon, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminErrorLogs() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('');
  const [selectedError, setSelectedError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getErrorLogs({ search, resolved: resolvedFilter });
      setData(res);
    } finally { setLoading(false); }
  }, [search, resolvedFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 350);
  };

  const handleToggleResolve = async (errorId) => {
    setActionLoading(errorId);
    try {
      await adminApi.resolveErrorLog(errorId);
      load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">System Exception & Error Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data.total} recorded backend exceptions & API errors</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-sm text-foreground transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-card border border-border rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search error message, path, or exception type..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select value={resolvedFilter} onChange={e => setResolvedFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
          <option value="">All Statuses</option>
          <option value="false">Unresolved Only</option>
          <option value="true">Resolved Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message & Path</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No exception errors recorded 🎉</td></tr>
            ) : (
              data.items.map((err, i) => (
                <motion.tr
                  key={err.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {err.error_type || 'Error'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="text-xs font-semibold text-foreground truncate">{err.error_message}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      <span className="font-bold text-foreground">{err.method}</span> {err.path}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {err.resolved ? (
                      <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" /> Unresolved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {err.created_at ? new Date(err.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedError(err)}
                        className="px-2.5 py-1 text-xs bg-muted hover:bg-black/5 dark:hover:bg-white/5 text-foreground rounded-lg border border-border transition-colors font-medium flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" /> Stack Trace
                      </button>
                      <button
                        onClick={() => handleToggleResolve(err.id)}
                        disabled={actionLoading === err.id}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors font-medium ${
                          err.resolved
                            ? 'bg-muted text-muted-foreground border-border hover:bg-black/5'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {err.resolved ? 'Reopen' : 'Resolve'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stack Trace Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedError(null)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-foreground">{selectedError.error_type} Stack Trace</h3>
              </div>
              <button onClick={() => setSelectedError(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2 text-xs flex-1 overflow-y-auto custom-scrollbar">
              <p><strong className="text-muted-foreground">Endpoint:</strong> <span className="font-mono text-foreground">{selectedError.method} {selectedError.path}</span></p>
              <p><strong className="text-muted-foreground">Message:</strong> <span className="text-foreground">{selectedError.error_message}</span></p>
              <p><strong className="text-muted-foreground">Timestamp:</strong> <span className="text-foreground">{new Date(selectedError.created_at).toLocaleString()}</span></p>
              <p className="pt-2"><strong className="text-muted-foreground">Python Exception Traceback:</strong></p>
              <pre className="p-4 bg-muted border border-border rounded-xl text-[11px] font-mono text-rose-400 overflow-x-auto whitespace-pre-wrap">
                {selectedError.stack_trace || 'No stack trace recorded.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
