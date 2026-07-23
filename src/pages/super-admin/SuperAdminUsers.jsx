import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, CheckCircle2, XCircle, LogOut, UserX, Shield } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const ROLE_BADGE = {
  super_admin: 'bg-violet-600/30 text-violet-200 border-violet-500/40',
  admin:       'bg-blue-600/20 text-blue-300 border-blue-600/30',
  editor:      'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
  viewer:      'bg-slate-700/50 text-slate-400 border-slate-600/30',
};

const STATUS_BADGE = {
  active:  'text-emerald-400',
  pending: 'text-amber-400',
  expired: 'text-rose-400',
};

export default function SuperAdminUsers() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsers({ search, role: roleFilter, status: statusFilter });
      setData(res);
    } finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = (v) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v), 350);
  };

  const handleForceLogout = async (userId) => {
    if (!confirm('Force logout this user? They will be logged out on next request.')) return;
    setActionLoading(userId + '-logout');
    try { await adminApi.forceLogoutUser(userId); load(); }
    finally { setActionLoading(null); }
  };

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(userId + '-status');
    try { await adminApi.updateUserStatus(userId, newStatus); load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data.total} total users across all organizations</p>
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
            placeholder="Search by email..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-500"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No users found</td></tr>
            ) : (
              data.items.map((u, i) => {
                const initial = u.email?.charAt(0)?.toUpperCase() || 'U';
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {initial}
                        </div>
                        <span className="text-slate-200">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.org_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${ROLE_BADGE[u.role] || ROLE_BADGE.viewer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${STATUS_BADGE[u.status] || 'text-slate-400'}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(u.id, 'expired')}
                            disabled={actionLoading === u.id + '-status'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="w-3 h-3" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.id, 'active')}
                            disabled={actionLoading === u.id + '-status'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleForceLogout(u.id)}
                          disabled={actionLoading === u.id + '-logout'}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Force logout"
                        >
                          <LogOut className="w-3 h-3" /> Logout
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
