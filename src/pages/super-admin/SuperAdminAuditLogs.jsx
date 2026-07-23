import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, FileText, User, Tag, Calendar, Info } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminAuditLogs() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ search, action: actionFilter });
      setData(res);
    } finally { setLoading(false); }
  }, [search, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 350);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data.total} recorded actions across all platform users & organizations</p>
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
            placeholder="Search action or email..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
          <option value="">All Action Types</option>
          <option value="user_create">User Create</option>
          <option value="user_status">User Status Change</option>
          <option value="user_logout">Force Logout</option>
          <option value="org_update">Org Update</option>
          <option value="org_delete">Org Delete</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
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
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No audit logs recorded yet</td></tr>
            ) : (
              data.items.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium text-xs">
                    {log.actor_email || log.actor_id || 'System'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {log.target_type ? `${log.target_type}:${log.target_id?.slice(0, 8) || ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 text-xs bg-muted hover:bg-black/5 dark:hover:bg-white/5 text-foreground rounded-lg border border-border transition-colors font-medium"
                    >
                      View Raw
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-bold text-foreground">Audit Log Event</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-muted-foreground">Action:</strong> <span className="font-mono text-foreground">{selectedLog.action}</span></p>
              <p><strong className="text-muted-foreground">Actor:</strong> <span className="text-foreground">{selectedLog.actor_email || 'System'}</span></p>
              <p><strong className="text-muted-foreground">Timestamp:</strong> <span className="text-foreground">{new Date(selectedLog.created_at).toLocaleString()}</span></p>
              <p><strong className="text-muted-foreground">Payload Details:</strong></p>
              <pre className="p-3 bg-muted border border-border rounded-xl text-[11px] font-mono text-foreground overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
