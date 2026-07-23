import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, TrendingUp, RefreshCw, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../services/adminApi';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function SuperAdminLLM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    try { setData(await adminApi.getLLMUsage(days)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [days]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">LLM Usage & Cost</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI query usage across all organizations</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${days === d ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}>
              {d}d
            </button>
          ))}
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Cpu, label: 'Total LLM Calls', value: data?.total_llm_calls?.toLocaleString(), color: 'bg-violet-600/20 text-violet-400' },
              { icon: TrendingUp, label: 'Success Rate', value: `${data?.success_rate}%`, color: 'bg-emerald-600/20 text-emerald-400' },
              { icon: DollarSign, label: 'Est. Cost (USD)', value: `$${data?.estimated_total_cost_usd}`, color: 'bg-blue-600/20 text-blue-400' },
              { icon: Cpu, label: 'Errors', value: data?.total_errors?.toLocaleString(), color: 'bg-rose-600/20 text-rose-400' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{value ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Daily trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Daily LLM Calls — Last {days} days</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.daily_trend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="llmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" name="Calls" stroke="#7c3aed" strokeWidth={2} fill="url(#llmGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Per-org breakdown */}
          {data?.per_org?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-semibold text-white">Usage by Organization (Top 20)</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Organization</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Queries</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Errors</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Avg ms</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 uppercase">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_org.map((o, i) => (
                    <tr key={o.org_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-slate-200">{o.org_name}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400 font-semibold">{o.query_count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-rose-400">{o.error_count}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400 font-mono text-xs">{o.avg_execution_ms}ms</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">${o.estimated_cost_usd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
