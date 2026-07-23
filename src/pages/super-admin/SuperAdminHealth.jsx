import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const STATUS_CONFIG = {
  ok:            { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Healthy' },
  configured:    { icon: CheckCircle2, color: 'text-blue-400',    bg: 'bg-blue-400',    label: 'Configured' },
  not_configured:{ icon: AlertCircle,  color: 'text-slate-500',   bg: 'bg-slate-600',   label: 'Not Configured' },
  unavailable:   { icon: AlertCircle,  color: 'text-amber-400',   bg: 'bg-amber-400',   label: 'Unavailable' },
  error:         { icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-400',    label: 'Error' },
};

function ServiceCard({ service, index }) {
  const cfg = STATUS_CONFIG[service.status] || STATUS_CONFIG.error;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
            {service.status === 'ok' && (
              <div className={`absolute inset-0 rounded-full ${cfg.bg} animate-ping opacity-30`} />
            )}
          </div>
          <p className="font-semibold text-white">{service.name}</p>
        </div>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
      {service.latency_ms && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {service.latency_ms}ms
        </p>
      )}
      {service.vector_count !== undefined && (
        <p className="text-xs text-slate-500 mt-1">{service.vector_count.toLocaleString()} vectors</p>
      )}
      {service.model && (
        <p className="text-xs text-slate-500 mt-1 font-mono">{service.model}</p>
      )}
      {service.error && (
        <p className="text-xs text-rose-400 mt-2 font-mono truncate" title={service.error}>{service.error}</p>
      )}
    </motion.div>
  );
}

export default function SuperAdminHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const timer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res);
      setLastCheck(new Date());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    timer.current = setInterval(load, 30_000);
    return () => clearInterval(timer.current);
  }, []);

  const overall = health?.overall;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Health</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Auto-refreshes every 30s
            {lastCheck && <span className="ml-2">• Last: {lastCheck.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overall && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${overall === 'healthy' ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-400' : 'bg-rose-600/10 border-rose-600/30 text-rose-400'}`}>
              <div className={`w-2 h-2 rounded-full ${overall === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {overall === 'healthy' ? 'All Systems Healthy' : 'Degraded'}
            </div>
          )}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Check Now
          </button>
        </div>
      </div>

      {loading && !health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(health?.services || []).map((service, i) => (
            <ServiceCard key={service.name} service={service} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
