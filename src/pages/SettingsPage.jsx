import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartSkeleton } from "@ela-labs/smart-skeleton-react";
import {
  Building2, Users, KeyRound, Mail, Shield, Check,
  Loader2, AlertCircle, Plus, Trash2, ChevronDown, Eye, EyeOff, RefreshCw, Crown, UserCog, Sparkles, X
} from 'lucide-react';
import { organizationApi, authApi } from '../services/api';
import { usePersonalization } from '../context/PersonalizationContext';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',      label: 'Profile',       icon: Sparkles },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'members',      label: 'Members',      icon: Users },
  { id: 'security',     label: 'Security',     icon: KeyRound },
];

// ERP module definitions for per-user access control
const ERP_MODULES = [
  {
    id: 'finance',
    label: 'Finance',
    defaultRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'ar', label: 'Accounts Receivable (AR)' },
      { id: 'ap', label: 'Accounts Payable (AP)' },
      { id: 'cashbook', label: 'Cashbook' },
      { id: 'gl', label: 'General Ledger (GL)' }
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    defaultRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'sorder', label: 'Sales Order (S Order)' },
      { id: 'sinvoice', label: 'Sales Invoice (S Invoice)' },
      { id: 'dispatch', label: 'Dispatch' }
    ]
  },
  {
    id: 'purchase',
    label: 'Purchase',
    defaultRoles: ['admin', 'editor'],
    subModules: [
      { id: 'porder', label: 'Purchase Order (P Order)' },
      { id: 'pinvoice', label: 'Purchase Invoice (P Invoice)' },
      { id: 'grn', label: 'Goods Received Note (GRN)' }
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    defaultRoles: ['admin', 'editor'],
    subModules: [
      { id: 'bom', label: 'Bill of Material (BOM)' },
      { id: 'wip', label: 'Work in Progress (WIP)' },
      { id: 'jobcosting', label: 'Job Costing' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    defaultRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'invvaluation', label: 'Inventory Valuation' },
      { id: 'invholding', label: 'Inventory Holding' }
    ]
  }
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

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ showToast }) {
  const { profile, updateProfile, getGreeting, getDisplayName } = usePersonalization();
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [preferredName, setPreferredName] = useState(profile.preferredName || '');
  const [greetingStyle, setGreetingStyle] = useState(profile.greetingStyle || 'time-based');
  const [aiTone, setAiTone] = useState(profile.aiTone || 'friendly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName || '');
    setPreferredName(profile.preferredName || '');
    setGreetingStyle(profile.greetingStyle || 'time-based');
    setAiTone(profile.aiTone || 'friendly');
  }, [profile.displayName, profile.preferredName, profile.greetingStyle, profile.aiTone]);

  const hasChanges = displayName !== (profile.displayName || '')
    || preferredName !== (profile.preferredName || '')
    || greetingStyle !== (profile.greetingStyle || 'time-based')
    || aiTone !== (profile.aiTone || 'friendly');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    updateProfile({ displayName: displayName.trim(), preferredName: preferredName.trim(), greetingStyle, aiTone });
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    showToast('Profile preferences saved', 'success');
  };

  const previewName = preferredName.trim() || displayName.trim() || getDisplayName();
  const previewGreeting = (() => {
    const hour = new Date().getHours();
    if (greetingStyle === 'casual') return 'Hey';
    if (greetingStyle === 'formal') return 'Hello';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-base font-semibold mb-1">Profile Personalization</h3>
        <p className="text-xs text-muted-foreground">Customize how the AI greets and addresses you.</p>
      </div>

      {/* Live Preview */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white via-[#93c5fd] to-[#2563eb] flex items-center justify-center shrink-0 shadow shadow-blue-500/20 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-700" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">AI Preview</p>
          <p className="text-sm text-foreground font-medium">
            {previewGreeting}, {previewName || 'there'}! How can I help you analyze your data today?
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">What should the AI call you?</label>
          <input
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder={profile.preferredName || profile.displayName || 'e.g. Keshav'}
            className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5"
          />
          {profile.preferredName && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Currently: <span className="font-medium text-foreground">{profile.preferredName}</span>
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">Greeting Style</label>
          <div className="flex gap-2">
            {['time-based', 'casual', 'formal'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setGreetingStyle(s)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium capitalize transition-all ${
                  greetingStyle === s
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-black/5 dark:bg-white/5 text-foreground/70 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {s === 'time-based' ? 'Time-based' : s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/85">AI Response Tone</label>
          <div className="flex gap-2">
            {[{ id: 'friendly', label: 'Friendly 😊' }, { id: 'professional', label: 'Professional' }, { id: 'concise', label: 'Concise' }].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAiTone(t.id)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  aiTone === t.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-black/5 dark:bg-white/5 text-foreground/70 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !hasChanges}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save Preferences
      </button>
    </form>
  );
}


// ─── Organization Tab ─────────────────────────────────────────────────────────
function OrganizationTab({ user, showToast }) {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [hideSqlQueries, setHideSqlQueries] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    organizationApi.getOrganization().then((o) => {
      setOrg(o);
      setName(o?.name || '');
      setHideSqlQueries(!!o?.hide_sql_queries);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hasChanges = name.trim() !== (org?.name || '') || hideSqlQueries !== !!org?.hide_sql_queries;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await organizationApi.updateOrganization({
        name: name.trim(),
        hide_sql_queries: hideSqlQueries,
      });
      setOrg(updated);
      setName(updated.name || '');
      setHideSqlQueries(!!updated.hide_sql_queries);
      showToast('Organization settings updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update organization settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SmartSkeleton loading={loading}>
      {loading ? (
        <div className="space-y-6 max-w-lg">
          <div>
            <h3 className="text-base font-semibold mb-1">Organization Details</h3>
            <p className="text-xs text-muted-foreground">Update your organization name and settings.</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4">
            <div>
              <div className="h-4 bg-muted rounded w-1/3 mb-2 animate-pulse" />
              <div className="h-10 bg-muted rounded-xl w-full animate-pulse" />
            </div>
            <div>
              <div className="h-4 bg-muted rounded w-1/4 mb-2 animate-pulse" />
              <div className="h-10 bg-muted rounded-xl w-full animate-pulse" />
            </div>

            {/* Privacy Settings */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-muted rounded animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                disabled={!isAdmin}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-transparent bg-black/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 dark:bg-white/5 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/85">Plan</label>
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary capitalize">
                <Shield className="h-4 w-4" />
                {org?.plan_type || 'Free'} Plan
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="pt-4 border-t border-border/40">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hideSqlQueries}
                  onChange={(e) => setHideSqlQueries(e.target.checked)}
                  disabled={!isAdmin}
                  className="mt-1 w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground/85 group-hover:text-primary transition-colors">Hide SQL Queries</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    When enabled, underlying SQL queries generated by AI or saved in query history will be redacted and hidden in response feeds.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {isAdmin && (
            <button
              type="submit"
              disabled={saving || !name.trim() || !hasChanges}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Changes
            </button>
          )}
        </form>
      )}
    </SmartSkeleton>
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
  const [activeAccessMember, setActiveAccessMember] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null); // { email: '...', acceptUrl: '...' }
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
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

  const loadRequests = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingRequests(true);
    try {
      const list = await organizationApi.listPermissionRequests();
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadMembers();
    if (isAdmin) {
      loadRequests();
    }
  }, [loadMembers, loadRequests, isAdmin]);

  const handleRequestAction = async (requestId, action) => {
    try {
      await organizationApi.actOnPermissionRequest(requestId, action);
      showToast(`Permission request ${action}d successfully.`, 'success');
      loadRequests();
      loadMembers();
    } catch (err) {
      showToast(err.message || `Failed to ${action} request.`, 'error');
    }
  };

  const getModuleInfo = (id) => {
    for (const parent of ERP_MODULES) {
      if (parent.id === id) return { mod: parent, isSub: false, parentId: parent.id, parentMod: parent };
      const sub = parent.subModules?.find(s => s.id === id);
      if (sub) return { mod: sub, isSub: true, parentId: parent.id, parentMod: parent };
    }
    return null;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await organizationApi.inviteUser({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      showToast(`Invite sent to ${inviteEmail}`, 'success');
      if (res && res.accept_url) {
        setCreatedInvite({ email: inviteEmail.trim(), acceptUrl: res.accept_url });
      }
      loadMembers();
    } catch (err) {
      showToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!isAdmin) return;
    try {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
      setShowRoleFor(null);
      showToast('Role updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handlePermToggle = async (member, moduleId) => {
    const info = getModuleInfo(moduleId);
    if (!info) return;
    const { mod, isSub, parentId, parentMod } = info;

    const perms = member.module_permissions || {};
    const defaultAllowed = isSub 
      ? (perms[parentId] !== undefined ? perms[parentId] : parentMod.defaultRoles.includes(member.role))
      : parentMod.defaultRoles.includes(member.role);
    const currentVal = perms[moduleId] !== undefined ? perms[moduleId] : defaultAllowed;
    const targetVal = !currentVal;

    let updated = { ...perms };
    if (!isSub) {
      // Toggle parent: update parent and all its subModules to match targetVal
      updated[moduleId] = targetVal;
      if (parentMod.subModules) {
        parentMod.subModules.forEach(sub => {
          updated[sub.id] = targetVal;
        });
      }
    } else {
      // Toggle subModule:
      updated[moduleId] = targetVal;
      if (targetVal === true) {
        // If enabling a subModule, parent must be enabled or defaults allowed
        if (updated[parentId] === false) {
          updated[parentId] = true;
          parentMod.subModules.forEach(sub => {
            if (sub.id !== moduleId && updated[sub.id] === undefined) {
              updated[sub.id] = false;
            }
          });
        }
      }
    }

    // Keep a backup of current permissions for rollback in case of error
    const previousPerms = member.module_permissions;

    // Optimistic Update: instantly update React state
    setMembers(prev => prev.map(m =>
      m.id === member.id ? { ...m, module_permissions: updated } : m
    ));
    setActiveAccessMember(prev => prev && prev.id === member.id ? { ...prev, module_permissions: updated } : prev);
    showToast(`${mod?.label} access ${targetVal ? 'granted' : 'revoked'} for ${member.email}`, 'success');

    try {
      await organizationApi.updatePermissions(member.id, updated);
    } catch (err) {
      // Rollback on failure
      setMembers(prev => prev.map(m =>
        m.id === member.id ? { ...m, module_permissions: previousPerms } : m
      ));
      setActiveAccessMember(prev => prev && prev.id === member.id ? { ...prev, module_permissions: previousPerms } : prev);
      showToast(err.message || 'Failed to update permission', 'error');
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

      {/* Pending Permission Requests */}
      {isAdmin && requests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <h3 className="text-base font-semibold text-amber-600 dark:text-amber-400">Permission Requests</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
              {requests.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className="flex items-center justify-between p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{req.user_email}</span>
                    <span className="text-[10px] text-muted-foreground">requested access to:</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {req.module_key.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRequestAction(req.id, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, 'deny')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all border border-zinc-700/50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
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

        <SmartSkeleton loading={loading}>
          {loading ? (
            <div className="rounded-2xl border border-border/60 bg-card/60 divide-y divide-border/40 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No members yet" subtitle="Invite colleagues to collaborate in this workspace." />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card/60 divide-y divide-border/40 overflow-hidden">
              {members.map((member) => (
                <div key={member.id}>
                  <div className="flex items-center justify-between px-5 py-3.5 group">
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
                      {/* Module access toggle — admin only, not self */}
                      {isAdmin && member.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => setActiveAccessMember(member)}
                          title="Module access"
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SmartSkeleton>
      </div>

      {/* Module Access Modal */}
      <AnimatePresence>
        {activeAccessMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-foreground"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-base">Module Access Controls</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold capitalize">
                      {activeAccessMember.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeAccessMember.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAccessMember(null)}
                  className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-4">
                  {ERP_MODULES.map(parentMod => {
                    const perms = activeAccessMember.module_permissions || {};
                    const isParentOverride = perms[parentMod.id] !== undefined;
                    const isParentAllowed = isParentOverride ? perms[parentMod.id] : parentMod.defaultRoles.includes(activeAccessMember.role);
                    
                    return (
                      <div key={parentMod.id} className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                        {/* Parent Module Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isParentAllowed ? 'bg-emerald-500 shadow shadow-emerald-500/35' : 'bg-muted-foreground/50'}`} />
                            {parentMod.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePermToggle(activeAccessMember, parentMod.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                              isParentAllowed
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm'
                                : 'bg-muted text-muted-foreground border-border hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/20'
                            }`}
                          >
                            {isParentAllowed ? <Check className="h-3 w-3" /> : <Shield className="h-3 w-3 opacity-60" />}
                            {isParentAllowed ? 'Enabled' : 'Restricted'}
                            {isParentOverride && <span className="text-[8px] opacity-60 ml-0.5">(custom)</span>}
                          </button>
                        </div>

                        {/* Sub-modules Grid */}
                        {parentMod.subModules && (
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-3 border-t border-border/40">
                            {parentMod.subModules.map(sub => {
                              const isSubOverride = perms[sub.id] !== undefined;
                              const isSubAllowed = isSubOverride 
                                ? perms[sub.id] 
                                : isParentAllowed; // inherit from parent allowed state
                              
                              return (
                                <button
                                  type="button"
                                  key={sub.id}
                                  onClick={() => handlePermToggle(activeAccessMember, sub.id)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-medium transition-all ${
                                    isSubAllowed
                                      ? 'bg-card text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/5'
                                      : 'bg-muted/40 text-muted-foreground/65 border-border hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/20'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {isSubAllowed ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/45" />
                                    )}
                                    {sub.label}
                                  </span>
                                  {isSubOverride && (
                                    <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                      Override
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                  💡 <strong>Toggling parent</strong> automatically enables/disables all its child sub-modules. Override settings are updated instantly on the backend and take effect immediately.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveAccessMember(null)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:opacity-95 text-white font-semibold rounded-xl text-xs shadow-lg shadow-primary/25 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Link Backup Modal */}
      <AnimatePresence>
        {createdInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-foreground"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Mail className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Invite Link Generated</h3>
                  <p className="text-xs text-muted-foreground">An invitation email was sent to {createdInvite.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Backup Invitation Link
                </label>
                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl p-2.5">
                  <input
                    type="text"
                    readOnly
                    value={createdInvite.acceptUrl}
                    className="flex-1 bg-transparent text-xs text-foreground outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInvite.acceptUrl);
                      showToast('Copied to clipboard!', 'success');
                    }}
                    className="flex items-center justify-center p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy Link"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/80">
                  If they do not receive the email, you can copy and share this link directly with them.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCreatedInvite(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
      await authApi.changePassword({ currentPassword, newPassword });
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === 'admin';
  const filteredTabs = TABS.filter(tab => {
    if (!isAdmin && (tab.id === 'organization' || tab.id === 'members')) {
      return false;
    }
    return true;
  });

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
        {filteredTabs.map((tab) => {
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
          {activeTab === 'profile' && <ProfileTab showToast={showToast} />}
          {activeTab === 'organization' && isAdmin && <OrganizationTab user={user} showToast={showToast} />}
          {activeTab === 'members' && isAdmin && <MembersTab user={user} showToast={showToast} />}
          {activeTab === 'security' && <SecurityTab showToast={showToast} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
