import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, MessageCircle, AlertTriangle,
  Lock, HelpCircle, BarChart2, TrendingUp,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminApi } from '../../services/adminApi';

// ── Type badge config ─────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  conversational: {
    label: 'Conversational',
    cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Icon: MessageCircle,
  },
  out_of_schema: {
    label: 'Out of Schema',
    cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Icon: HelpCircle,
  },
  access_denied: {
    label: 'Access Denied',
    cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Icon: Lock,
  },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || {
    label: type || 'Unknown',
    cls: 'bg-muted text-muted-foreground border-border',
    Icon: MessageCircle,
  };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-foreground font-semibold mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Dual-axis Combo Chart ─────────────────────────────────────────────────────
function ConvQueryChart({ dailyTrend, byType }) {
  // Build chart data: each day has stacked bars by type + cumulative line
  const chartData = useMemo(() => {
    // daily_trend from stats is [{date, count}] — we enrich with type breakdown later
    // For the line, compute running cumulative total
    let running = 0;
    return (dailyTrend || []).map((d) => {
      running += d.count;
      return {
        date: d.date ? d.date.slice(5) : '', // Show MM-DD
        total: d.count,
        cumulative: running,
      };
    });
  }, [dailyTrend]);

  const hasData = chartData.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-foreground">Daily Volume — Conversational Queries</p>
          <p className="text-xs text-muted-foreground mt-0.5">Bars = daily count &nbsp;·&nbsp; Line = cumulative total (right axis)</p>
        </div>
        {/* Breakdown pills */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <MessageCircle className="w-2.5 h-2.5" /> {byType?.conversational ?? 0} chat
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <HelpCircle className="w-2.5 h-2.5" /> {byType?.out_of_schema ?? 0} schema
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Lock className="w-2.5 h-2.5" /> {byType?.access_denied ?? 0} denied
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <BarChart2 className="w-8 h-8 opacity-25" />
          <p className="text-xs">No data yet — chart will populate automatically as users chat</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 32, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
              tickLine={false}
              axisLine={false}
            />
            {/* Left Y-axis — daily count */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              label={{
                value: 'Daily Count',
                angle: -90,
                position: 'insideLeft',
                offset: 16,
                style: { fontSize: 9, fill: 'currentColor', opacity: 0.35 },
              }}
            />
            {/* Right Y-axis — cumulative (Z-axis like secondary measure) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#f59e0b', opacity: 0.7 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              label={{
                value: 'Cumulative',
                angle: 90,
                position: 'insideRight',
                offset: 12,
                style: { fontSize: 9, fill: '#f59e0b', opacity: 0.55 },
              }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
            {/* Bars — daily total */}
            <Bar
              yAxisId="left"
              dataKey="total"
              name="Daily Total"
              fill="url(#barGrad)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            {/* Line — cumulative (secondary / right Z-axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Total"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'bg-primary/10 text-primary', Icon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-xs">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground tabular-nums">{value ?? '—'}</p>
        <p className="text-xs font-semibold text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────
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
        <td className="px-4 py-3 text-foreground text-xs whitespace-nowrap truncate max-w-[140px]">{q.user_email}</td>
        <td className="px-4 py-3 max-w-sm">
          <p className="text-foreground text-xs font-medium truncate">{q.natural_language_input}</p>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <TypeBadge type={q.response_type} />
        </td>
        <td className="px-4 py-3 text-right">
          {expanded ? <ChevronUp className="w-4 h-4 text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="bg-muted/40 border-b border-border px-6 py-4">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Query input */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">User Query</p>
                    <div className="bg-zinc-950 dark:bg-black rounded-xl p-3.5 border border-border">
                      <p className="text-xs text-blue-300 font-mono whitespace-pre-wrap break-words">{q.natural_language_input}</p>
                    </div>
                  </div>
                  {/* AI Response */}
                  {q.ai_response && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">AI Response</p>
                      <div className="bg-zinc-950 dark:bg-black rounded-xl p-3.5 border border-border max-h-40 overflow-y-auto">
                        <p className="text-xs text-emerald-300 font-mono whitespace-pre-wrap break-words">{q.ai_response}</p>
                      </div>
                    </div>
                  )}
                  {/* Metadata */}
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Metadata</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-1 bg-card border border-border rounded-lg text-muted-foreground">
                        <span className="font-semibold text-foreground">Org:</span> {q.org_name} ({q.org_id})
                      </span>
                      <span className="px-2 py-1 bg-card border border-border rounded-lg text-muted-foreground">
                        <span className="font-semibold text-foreground">User:</span> {q.user_email}
                      </span>
                      {q.session_id && (
                        <span className="px-2 py-1 bg-card border border-border rounded-lg text-muted-foreground font-mono text-[10px]">
                          Session: {q.session_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SuperAdminConversationalQueries() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [filters, setFilters] = useState({
    search: '', response_type: '', from_date: '', to_date: '',
  });
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const [res, statsRes] = await Promise.all([
        adminApi.getConversationalQueries({ ...filters, skip, limit }),
        stats === null ? adminApi.getConversationalQueryStats(30) : Promise.resolve(null),
      ]);
      setData(res);
      if (statsRes) setStats(statsRes);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setPage(1);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Conversational Queries</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            Monitor all non-reporting &amp; chat queries sent by users across orgs
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-sm text-foreground transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total (30d)"
            value={stats.total?.toLocaleString()}
            Icon={BarChart2}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            label="Conversational"
            value={stats.by_type?.conversational?.toLocaleString()}
            sub="General chat / greetings"
            Icon={MessageCircle}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            label="Out of Schema"
            value={stats.by_type?.out_of_schema?.toLocaleString()}
            sub="LLM couldn't map to tables"
            Icon={HelpCircle}
            color="bg-amber-500/10 text-amber-500"
          />
          <StatCard
            label="Access Denied"
            value={stats.by_type?.access_denied?.toLocaleString()}
            sub="Module permission blocked"
            Icon={Lock}
            color="bg-rose-500/10 text-rose-500"
          />
        </div>
      )}

      {/* ── Dual-axis Chart: auto-populates from daily_trend stats ── */}
      {stats && (
        <ConvQueryChart
          dailyTrend={stats.daily_trend}
          byType={stats.by_type}
        />
      )}

      {/* Top Orgs (if stats loaded) */}
      {stats?.top_orgs?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Top Orgs by Conversational Volume (30d)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.top_orgs.map((org, i) => (
              <div key={org.org_id} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                <span className="text-xs font-semibold text-foreground">{org.org_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">{org.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-xs">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search queries or AI responses..."
            onChange={e => setFilter('search', e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-medium"
          />
        </div>
        <select
          value={filters.response_type}
          onChange={e => setFilter('response_type', e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs"
        >
          <option value="">All Types</option>
          <option value="conversational">Conversational</option>
          <option value="out_of_schema">Out of Schema</option>
          <option value="access_denied">Access Denied</option>
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.from_date}
            onChange={e => setFilter('from_date', e.target.value)}
            className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs"
          />
          <input
            type="date"
            value={filters.to_date}
            onChange={e => setFilter('to_date', e.target.value)}
            className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-medium outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">Time</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Query</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Type</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 opacity-30" />
                    <p className="font-semibold text-foreground">No conversational queries found</p>
                    <p className="text-sm">Queries will appear here once users start chatting without data requests</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.items.map((q) => <QueryRow key={q.id} q={q} />)
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-border bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex items-center gap-3 text-xs font-medium text-foreground">
            <span>
              Showing <strong className="text-foreground">{data.total > 0 ? startItem : 0}</strong> to{' '}
              <strong className="text-foreground">{endItem}</strong> of{' '}
              <strong className="text-foreground">{data.total}</strong> queries
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
