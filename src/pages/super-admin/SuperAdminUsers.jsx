import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, CheckCircle2, XCircle, LogOut, UserX, Shield, UserPlus, X, Key } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const ROLE_BADGE = {
  super_admin: 'bg-zinc-800 text-zinc-100 border-zinc-700',
  admin:       'bg-blue-600/20 text-blue-400 border-blue-600/30',
  editor:      'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  viewer:      'bg-slate-700/50 text-slate-400 border-slate-600/30',
};

const STATUS_BADGE = {
  active:  'text-emerald-400',
  pending: 'text-amber-400',
  expired: 'text-rose-400',
};

export default function SuperAdminUsers() {
  const [data, setData] = useState({ total: 0, items: [] });
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const searchTimer = useRef(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', org_id: '', role: 'viewer', status: 'active' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsers({ search, role: roleFilter, status: statusFilter });
      setData(res);
    } finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  const loadOrgs = useCallback(async () => {
    try {
      const res = await adminApi.getOrganizations({ limit: 100 });
      if (res?.items) {
        setOrgs(res.items);
        if (res.items.length > 0 && !addForm.org_id) {
          setAddForm(prev => ({ ...prev, org_id: res.items[0].id }));
        }
      }
    } catch {}
  }, [addForm.org_id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadOrgs(); }, [loadOrgs]);

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

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setAddForm(prev => ({ ...prev, password: pwd }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!addForm.email.includes('@')) return setAddError('Please enter a valid email');
    if (addForm.password.length < 6) return setAddError('Password must be at least 6 characters');
    if (!addForm.org_id) return setAddError('Please select an organization');

    setIsSubmitting(true);
    try {
      await adminApi.createUser(addForm);
      setAddSuccess('User created successfully!');
      setAddForm({ email: '', password: '', org_id: orgs[0]?.id || '', role: 'viewer', status: 'active' });
      load();
      setTimeout(() => { setShowAddModal(false); setAddSuccess(''); }, 1200);
    } catch (err) {
      setAddError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">All Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data.total} total users across all organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-semibold transition-opacity shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-black/5 dark:hover:bg-white/5 border border-border rounded-xl text-sm text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-card border border-border rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search by email..."
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[0.02] dark:bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Organization</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data.items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-foreground font-medium">No users found</td></tr>
            ) : (
              data.items.map((u, i) => {
                const initial = u.email?.charAt(0)?.toUpperCase() || 'U';
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-xs font-bold text-white dark:text-zinc-900 flex-shrink-0">
                          {initial}
                        </div>
                        <span className="text-foreground font-semibold">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium text-xs">{u.org_name || 'none'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${ROLE_BADGE[u.role] || ROLE_BADGE.viewer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${STATUS_BADGE[u.status] || 'text-foreground'}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(u.id, 'expired')}
                            disabled={actionLoading === u.id + '-status'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="w-3 h-3" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.id, 'active')}
                            disabled={actionLoading === u.id + '-status'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                            title="Activate"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleForceLogout(u.id)}
                          disabled={actionLoading === u.id + '-logout'}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
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

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-foreground" />
                  <h2 className="text-base font-bold text-foreground">Add New User</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                  {addSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@company.com"
                    value={addForm.email}
                    onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">Password</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" /> Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter or generate password"
                    value={addForm.password}
                    onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Organization</label>
                  <select
                    value={addForm.org_id}
                    onChange={e => setAddForm(prev => ({ ...prev, org_id: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  >
                    {orgs.length === 0 && <option value="default">Default Organization</option>}
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Role</label>
                  <select
                    value={addForm.role}
                    onChange={e => setAddForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="editor">Editor (Can Query & Manage)</option>
                    <option value="admin">Admin (Org Manager)</option>
                    <option value="super_admin">Super Admin (Platform Level)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-muted hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-sm font-medium text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
