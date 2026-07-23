import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, Database, BarChart3, AlertTriangle, CheckCircle2, XCircle, Clock, Crown } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

function InfoCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function SuperAdminOrgDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    adminApi.getOrganization(id)
      .then(setOrg)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-24 animate-pulse" />
      ))}
    </div>
  );

  if (error || !org) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center py-12">
        <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <p className="text-slate-300 font-semibold">{error || 'Organization not found'}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/super-admin/organizations')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold">
            {org.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{org.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-600/30 uppercase font-semibold">{org.plan_type}</span>
              {org.is_suspended
                ? <span className="flex items-center gap-1 text-xs text-rose-400"><XCircle className="w-3 h-3" /> Suspended</span>
                : <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Active</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard label="Members" value={org.member_count} />
        <InfoCard label="Connections" value={org.connection_count} />
        <InfoCard label="Queries (7d)" value={org.queries_7d?.toLocaleString()} color="text-emerald-400" />
        <InfoCard label="Queries (30d)" value={org.queries_30d?.toLocaleString()} color="text-blue-400" />
        <InfoCard label="Errors (7d)" value={org.errors_7d} color={org.errors_7d > 0 ? 'text-rose-400' : 'text-slate-300'} />
        <InfoCard label="Hide SQL" value={org.hide_sql_queries ? 'Yes' : 'No'} />
        <InfoCard label="Org ID" value={org.id?.slice(0,12) + '…'} color="text-slate-400" />
        <InfoCard label="Created" value={org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'} />
      </div>

      {/* Members */}
      {org.members?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Members ({org.members.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Email</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Role</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {org.members.map((m) => (
                <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200">{m.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${m.role === 'admin' ? 'bg-violet-600/20 text-violet-300 border-violet-600/30' : 'bg-slate-700/50 text-slate-400 border-slate-600/30'}`}>{m.role}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${m.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Connections */}
      {org.connections?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-white">Connections ({org.connections.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 uppercase">Last Tested</th>
              </tr>
            </thead>
            <tbody>
              {org.connections.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-slate-200">{c.name}</td>
                  <td className="px-4 py-2.5"><span className="text-xs text-slate-400 uppercase font-mono">{c.db_type}</span></td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${c.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{c.last_tested_at ? new Date(c.last_tested_at).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
