import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Users, Zap, AlertTriangle, TrendingUp,
  Activity, BarChart3, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { adminApi } from '../../services/adminApi';

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

const PIE_COLORS = ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa'];

function StatCard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function SuperAdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-28 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center">
        <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <p className="text-slate-300 font-semibold">Failed to load stats</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  const planData = stats?.plan_distribution
    ? Object.entries(stats.plan_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time metrics across all organizations</p>
      </div>

      {/* Alerts */}
      {(stats?.suspended_orgs > 0 || stats?.error_rate_today > 10) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-sm">
            {stats.suspended_orgs > 0 && (
              <span className="text-amber-300 font-medium">{stats.suspended_orgs} suspended org(s). </span>
            )}
            {stats.error_rate_today > 10 && (
              <span className="text-amber-300 font-medium">High error rate: {stats.error_rate_today}% today. </span>
            )}
          </div>
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard index={0} icon={Building2} label="Total Organizations" value={stats?.total_orgs?.toLocaleString()} sub={`+${stats?.new_orgs_week} this week`} color="bg-violet-600/20 text-violet-400" />
        <StatCard index={1} icon={Users}     label="Total Users" value={stats?.total_users?.toLocaleString()} sub={`+${stats?.new_users_week} this week`} color="bg-blue-600/20 text-blue-400" />
        <StatCard index={2} icon={Zap}       label="Queries Today" value={stats?.queries_today?.toLocaleString()} sub={`${stats?.queries_week} this week`} color="bg-emerald-600/20 text-emerald-400" />
        <StatCard index={3} icon={AlertTriangle} label="Errors Today" value={stats?.errors_today?.toLocaleString()} sub={`${stats?.error_rate_today}% error rate`} color={stats?.error_rate_today > 5 ? "bg-rose-600/20 text-rose-400" : "bg-slate-700/40 text-slate-400"} />
        <StatCard index={4} icon={Activity}  label="Active Connections" value={stats?.total_connections?.toLocaleString()} color="bg-cyan-600/20 text-cyan-400" />
        <StatCard index={5} icon={TrendingUp} label="Queries (7d)" value={stats?.queries_week?.toLocaleString()} color="bg-indigo-600/20 text-indigo-400" />
        <StatCard index={6} icon={CheckCircle2} label="Free Plan Orgs" value={stats?.plan_distribution?.free?.toLocaleString()} color="bg-slate-700/40 text-slate-300" />
        <StatCard index={7} icon={BarChart3}  label="Pro + Enterprise" value={((stats?.plan_distribution?.pro || 0) + (stats?.plan_distribution?.enterprise || 0)).toLocaleString()} color="bg-violet-600/20 text-violet-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Query Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Query Volume — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.query_trend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="queries" name="Queries" stroke="#7c3aed" strokeWidth={2} fill="url(#qGrad)" dot={false} />
              <Area type="monotone" dataKey="errors" name="Errors" stroke="#f43f5e" strokeWidth={1.5} fill="url(#eGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-4">Plan Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-slate-400 text-xs capitalize">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
