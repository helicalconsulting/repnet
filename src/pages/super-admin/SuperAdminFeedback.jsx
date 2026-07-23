import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare, Code2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminFeedback() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await adminApi.getFeedbacks({ search, rating: ratingFilter, skip, limit });
      setData(res);
    } finally { setLoading(false); }
  }, [search, ratingFilter, page, limit]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v) => {
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 350);
  };

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, data?.total || 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Feedback</h1>
          <p className="text-foreground text-sm font-medium mt-0.5">
            <span className="font-bold text-foreground">{data.total || 0}</span> query feedback submissions from users
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-sm text-foreground transition-colors font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-card border border-border rounded-xl px-3 py-2 shadow-xs">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search query, comment, or category..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs"
        >
          <option value="">All Ratings</option>
          <option value="positive">Thumbs Up (Positive 👍)</option>
          <option value="negative">Thumbs Down (Negative 👎)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Rating</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">User & Org</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Query Input</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Comment</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-foreground font-medium">No user feedback recorded yet</td></tr>
            ) : (
              data.items.map((fb, i) => (
                <motion.tr
                  key={fb.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {fb.is_positive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <ThumbsUp className="w-3.5 h-3.5" /> Positive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <ThumbsDown className="w-3.5 h-3.5" /> Negative
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-foreground">{fb.user_email}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{fb.org_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border capitalize">
                      {fb.category || 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs font-medium text-foreground truncate">{fb.natural_language_input || '—'}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-foreground font-medium truncate">{fb.comment || 'No comment provided'}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium text-xs whitespace-nowrap">
                    {fb.submitted_at ? new Date(fb.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedFeedback(fb)}
                      className="px-2.5 py-1 text-xs bg-muted hover:bg-black/5 dark:hover:bg-white/5 text-foreground rounded-lg border border-border transition-colors font-semibold"
                    >
                      View Details
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-border bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 text-xs font-medium text-foreground">
            <span>
              Showing <strong className="text-foreground">{data.total > 0 ? startItem : 0}</strong> to <strong className="text-foreground">{endItem}</strong> of <strong className="text-foreground">{data.total}</strong> feedbacks
            </span>
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

      {/* Feedback Detail Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedFeedback(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-foreground" />
                  <h3 className="text-base font-bold text-foreground">User Feedback Detail</h3>
                </div>
                <button onClick={() => setSelectedFeedback(null)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
              </div>

              <div className="space-y-3 text-xs flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                  <div>
                    <p className="font-bold text-foreground text-sm">{selectedFeedback.user_email}</p>
                    <p className="text-muted-foreground">{selectedFeedback.org_name}</p>
                  </div>
                  <div>
                    {selectedFeedback.is_positive ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Thumbs Up
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> Thumbs Down
                      </span>
                    )}
                  </div>
                </div>

                {selectedFeedback.comment && (
                  <div>
                    <p className="font-bold text-foreground mb-1">User Comment:</p>
                    <div className="p-3 bg-muted border border-border rounded-xl text-foreground font-medium">
                      "{selectedFeedback.comment}"
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-bold text-foreground mb-1">Original Query:</p>
                  <p className="p-3 bg-muted border border-border rounded-xl text-foreground font-medium">
                    {selectedFeedback.natural_language_input || '—'}
                  </p>
                </div>

                {selectedFeedback.generated_sql && (
                  <div>
                    <p className="font-bold text-foreground mb-1 flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Generated SQL:
                    </p>
                    <pre className="p-3 bg-zinc-950 text-emerald-400 border border-border rounded-xl text-[11px] font-mono overflow-x-auto">
                      {selectedFeedback.generated_sql}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
