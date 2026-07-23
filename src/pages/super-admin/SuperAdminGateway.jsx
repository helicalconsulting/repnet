import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Database, Clock, Building2 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminGateway() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGatewayAgents();
      setAgents(Array.isArray(res) ? res : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const online = agents.filter(a => a.is_online).length;
  const offline = agents.filter(a => !a.is_online).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gateway Agent Monitor</h1>
          <p className="text-slate-400 text-sm mt-0.5">All on-premise gateway agents across organizations</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Agents', value: agents.length, color: 'text-white' },
          { label: 'Online', value: online, color: 'text-emerald-400' },
          { label: 'Offline', value: offline, color: 'text-rose-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Agents table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Connection</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">DB Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Tested</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : agents.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                <Wifi className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No gateway agents registered
              </td></tr>
            ) : (
              agents.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${a.is_online ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-400'}`} />
                      <span className={`text-xs font-semibold ${a.is_online ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {a.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{a.org_name}</td>
                  <td className="px-4 py-3 text-slate-300">{a.connection_name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.agent_name || '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-400 uppercase font-mono">{a.db_type}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.last_tested_at ? new Date(a.last_tested_at).toLocaleString() : 'Never'}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
