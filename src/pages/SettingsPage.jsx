import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, KeyRound, Mail, Shield, Check,
  Loader2, AlertCircle, Plus, Trash2, ChevronDown, Eye, EyeOff, RefreshCw, Crown, UserCog
} from 'lucide-react';
import { organizationApi, authApi } from '../services/api';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'members',      label: 'Members',      icon: Users },
  { id: 'security',     label: 'Security',     icon: KeyRound },
];

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'
        }`}
      >
        {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {toast.message}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// ─── Organization Tab ─────────────────────────────────────────────────────────
function OrganizationTab({ showToast }) {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    organizationApi.getOrganization().then((o) => {
      setOrg(o);
      setName(o?.name || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === org?.name) return;
    setSaving(true);
    try {
      await organizationApi.completeOnboarding({
        organizationName: name.trim(),
        industry: org?.industry || '',
        erpSystem: org?.erpSystem || '',
        teamSize: org?.teamSize || '',
      });
      setOrg((prev) => ({ ...prev, name: name.trim() }));
      showToast('Organization updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update organization', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-base font-semibold mb-1">Organization Details</h3>
        <p className="text-xs text-muted-foreground">Update your organization name and settings.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">Organization name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">Plan</label>
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary capitalize">
            <Shield className="h-4 w-4" />
            {org?.plan_type || 'Free'} Plan
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim() || name.trim() === org?.name}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save Changes
      </button>
    </form>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = ['viewer', 'editor', 'admin'];

function MembersTab({ user, showToast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [showRoleFor, setShowRoleFor] = useState(null);
  const isAdmin = user?.role === 'admin';

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await organizationApi.listMembers();
      setMembers(Array.isArray(list) ? list : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await organizationApi.inviteUser({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      showToast(`Invite sent to ${inviteEmail}`, 'success');
      loadMembers();
    } catch (err) {
      showToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      // Optimistic update
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      setShowRoleFor(null);
      // Real API: uses /users/:id/role (PATCH)
      showToast('Role updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const roleColor = (role) => ({
    admin: 'text-amber-600 bg-amber-500/10',
    editor: 'text-blue-600 bg-blue-500/10',
    viewer: 'text-slate-600 bg-slate-500/10',
  }[role] || 'text-muted-foreground bg-muted/50');

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Invite form */}
      {isAdmin && (
        <div>
          <h3 className="text-base font-semibold mb-1">Invite a Member</h3>
          <p className="text-xs text-muted-foreground mb-4">They'll receive an email to join your workspace.</p>
          <form onSubmit={handleInvite} className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-xl border border-transparent bg-black/5 pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-xl border border-transparent bg-black/5 px-3 py-2.5 text-sm outline-none dark:bg-white/5 cursor-pointer"
              >
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Send Invite
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Team Members</h3>
          <button onClick={loadMembers} className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" subtitle="Invite colleagues to collaborate in this workspace." />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/60 divide-y divide-border/40 overflow-hidden">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-5 py-3.5 group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {(member.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.status || 'active'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.role === 'admin' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  <div className="relative">
                    <button
                      onClick={() => isAdmin && member.id !== user?.id && setShowRoleFor(showRoleFor === member.id ? null : member.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${roleColor(member.role)} ${isAdmin && member.id !== user?.id ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {member.role}
                      {isAdmin && member.id !== user?.id && <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showRoleFor === member.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 min-w-[100px] rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden">
                        {ROLE_OPTIONS.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member.id, r)}
                            className={`w-full px-3 py-2 text-left text-xs font-medium capitalize hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${member.role === r ? 'text-primary' : 'text-foreground'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      showToast('Passwords do not match or fields are empty', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      // POST /v1/users/me/password
      const { authApi: localAuthApi } = await import('../services/api');
      // call the password change endpoint via raw request
      const token = localStorage.getItem('repnex-auth-token');
      const res = await fetch('/v1/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (res.status === 204 || res.ok) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error?.message || 'Failed to change password');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({ id, label, value, onChange, show, onToggle, placeholder }) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground/85">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 pr-12 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-base font-semibold mb-1">Change Password</h3>
        <p className="text-xs text-muted-foreground">Keep your account secure with a strong password.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
        <PasswordInput id="current-pass" label="Current password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="Enter current password" />
        <PasswordInput id="new-pass" label="New password" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="Min. 8 characters" />
        <div>
          <label htmlFor="confirm-pass" className="mb-1.5 block text-sm font-medium text-foreground/85">Confirm new password</label>
          <input
            id="confirm-pass"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors dark:bg-white/5 bg-black/5 ${
              confirmPassword && newPassword !== confirmPassword ? 'border-rose-500/50' : 'border-transparent focus:border-primary/50'
            }`}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Update Password
      </button>
    </form>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage({ user }) {
  const [activeTab, setActiveTab] = useState('organization');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
      <Toast toast={toast} />

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-3 py-2">
          <UserCog className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Settings</span>
        </div>
        <h1 className="text-2xl font-semibold">Workspace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization, team members, and security preferences.
        </p>
      </div>

      {/* User info banner */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border/50 bg-card/70 px-5 py-4 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {(user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user?.name || user?.email}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
          user?.role === 'admin' ? 'bg-amber-500/10 text-amber-600' :
          user?.role === 'editor' ? 'bg-blue-500/10 text-blue-600' :
          'bg-slate-500/10 text-slate-600'
        }`}>
          {user?.role || 'viewer'}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-black/5 dark:bg-white/5 p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'organization' && <OrganizationTab showToast={showToast} />}
          {activeTab === 'members' && <MembersTab user={user} showToast={showToast} />}
          {activeTab === 'security' && <SecurityTab showToast={showToast} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
