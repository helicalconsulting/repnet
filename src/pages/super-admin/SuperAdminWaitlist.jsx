import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Inbox, RefreshCw, Download, Mail } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminWaitlist() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await adminApi.getWaitlist()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data.items.length) return;
    const headers = ['Email', 'Name', 'Company', 'Phone', 'Country', 'Joined'];
    const rows = data.items.map(i => [
      i.email, i.name, i.company, i.phone, i.country,
      i.created_at ? new Date(i.created_at).toLocaleDateString() : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `waitlist_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Waitlist</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            <span className="text-violet-400 font-semibold">{data.total}</span> total signups
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white font-semibold transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={load}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-3xl font-bold text-white">{data.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total Waitlist Signups</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:col-span-2 flex items-center justify-center">
          <div className="text-center">
            <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Export the full list to CSV to send bulk emails</p>
          </div>
        </motion.div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No waitlist entries found
              </td></tr>
            ) : (
              data.items.map((item, i) => (
                <motion.tr key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200">{item.email}</td>
                  <td className="px-4 py-3 text-slate-300">{item.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{item.company || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{item.country || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
