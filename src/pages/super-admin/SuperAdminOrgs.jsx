import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Building2, ChevronRight, Pencil, Trash2,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Crown,
  MoreVertical, ExternalLink
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const PLAN_BADGE = {
  free:       'bg-slate-700/60 text-slate-300 border-slate-600/50',
  pro:        'bg-blue-600/20 text-blue-300 border-blue-600/30',
  enterprise: 'bg-violet-600/20 text-violet-300 border-violet-600/30',
};

function PlanBadge({ plan }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${PLAN_BADGE[plan] || PLAN_BADGE.free}`}>
      {plan}
    </span>
  );
}

function StatusDot({ suspended }) {
  return suspended
    ? <span className="flex items-center gap-1 text-xs text-rose-400"><XCircle className="w-3.5 h-3.5" /> Suspended</span>
    : <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
}

function EditOrgModal({ org, onClose, onSave }) {
  const [form, setForm] = useState({
    name: org.name,
    plan_type: org.plan_type,
    is_suspended: org.is_suspended,
    hide_sql_queries: org.hide_sql_queries,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(org.id, form); onClose(); }
    catch { /* handled in parent */ }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
      >
        <h3 className="text-base font-bold text-white mb-4">Edit Organization</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Plan</label>
            <select value={form.plan_type} onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_suspended: !f.is_suspended }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_suspended ? 'bg-rose-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${form.is_suspended ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-300">Suspended</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, hide_sql_queries: !f.hide_sql_queries }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.hide_sql_queries ? 'bg-violet-600' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${form.hide_sql_queries ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-300">Hide SQL Queries</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuperAdminOrgs() {
  const navigate = useNavigate();
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [suspendedFilter, setSuspendedFilter] = useState('');
  const [editOrg, setEditOrg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrganizations({ search, plan: planFilter, suspended: suspendedFilter });
      setData(res);
    } finally { setLoading(false); }
  }, [search, planFilter, suspendedFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 350);
  };

  const handleSaveOrg = async (id, payload) => {
    await adminApi.updateOrganization(id, payload);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this organization and ALL its data? This cannot be undone.')) return;
    setDeletingId(id);
    try { await adminApi.deleteOrganization(id); load(); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Organizations</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data.total} total organizations</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            placeholder="Search organizations..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-500"
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={suspendedFilter} onChange={e => setSuspendedFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Connections</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Queries (30d)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No organizations found</td></tr>
            ) : (
              data.items.map((org, i) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs flex-shrink-0">
                        {org.name?.charAt(0)?.toUpperCase() || 'O'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{org.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{org.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={org.plan_type} /></td>
                  <td className="px-4 py-3"><StatusDot suspended={org.is_suspended} /></td>
                  <td className="px-4 py-3 text-right text-slate-300">{org.member_count}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{org.connection_count}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={org.queries_30d > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {org.queries_30d.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{org.owner_email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="View detail">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditOrg(org)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(org.id)} disabled={deletingId === org.id}
                        className="p-1.5 hover:bg-rose-600/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editOrg && (
        <EditOrgModal org={editOrg} onClose={() => setEditOrg(null)} onSave={handleSaveOrg} />
      )}
    </div>
  );
}
