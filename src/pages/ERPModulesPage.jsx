import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Package, Factory, Warehouse,
  Search, Loader2, AlertCircle, CheckCircle2, Lock,
  Download, ChevronRight, BarChart3, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryApi, exportApi } from '../services/api';

// ── ERP Module config (used for display hints & backend RBAC reference) ────
export const ERP_MODULES = [
  { id: 'finance',       label: 'Finance',       icon: DollarSign, allowedRoles: ['admin', 'editor', 'viewer'], color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  { id: 'sales',         label: 'Sales',          icon: ShoppingCart, allowedRoles: ['admin', 'editor', 'viewer'], color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'purchase',      label: 'Purchase',       icon: Package,    allowedRoles: ['admin', 'editor'],           color: 'text-orange-500',  bg: 'bg-orange-500/10' },
  { id: 'manufacturing', label: 'Manufacturing',  icon: Factory,    allowedRoles: ['admin', 'editor'],           color: 'text-violet-500',  bg: 'bg-violet-500/10' },
  { id: 'inventory',     label: 'Inventory',      icon: Warehouse,  allowedRoles: ['admin', 'editor', 'viewer'], color: 'text-rose-500',    bg: 'bg-rose-500/10' },
];

const QUICK_QUERIES = [
  { label: 'AP Ageing',          query: 'Show accounts payable ageing by supplier',       module: 'finance' },
  { label: 'AR Ageing',          query: 'Show accounts receivable ageing by customer',     module: 'finance' },
  { label: 'Trial Balance',      query: 'Show general ledger trial balance',               module: 'finance' },
  { label: 'Open Sales Orders',  query: 'Show all open sales orders with status',          module: 'sales' },
  { label: 'Purchase Orders',    query: 'Show all purchase orders with approval status',    module: 'purchase' },
  { label: 'Inventory Valuation',query: 'Show inventory valuation report by item',         module: 'inventory' },
  { label: 'WIP Status',         query: 'Show work in progress production status',          module: 'manufacturing' },
  { label: 'Job Costing',        query: 'Show job costing actual vs budget report',         module: 'manufacturing' },
];

// ── Result Table ─────────────────────────────────────────────────────────────
function ResultTable({ rows, onExport }) {
  if (!rows?.length) return null;
  const headers = Object.keys(rows[0]).filter(k => k !== '__rowId');
  return (
    <div className="mt-4 rounded-2xl border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <span className="text-xs font-semibold text-muted-foreground">{rows.length} rows returned</span>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 sticky top-0">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-foreground/70 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-4 py-2.5 text-foreground/80 whitespace-nowrap">
                    {row[h] == null ? <span className="text-muted-foreground/50">—</span> : String(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ERP Query Page ───────────────────────────────────────────────────────
export default function ERPModulesPage() {
  const { user, activeConnection } = useApp();
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [denied, setDenied]     = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const runQuery = async (q) => {
    const text = (q || query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setResult(null);
    setError('');
    setDenied('');

    try {
      const res = await queryApi.chat({
        naturalLanguage: text,
        connectionId: activeConnection?.id || null,
      });

      if (res.type === 'access_denied') {
        setDenied(res.message || 'You do not have access to this module.');
        return;
      }

      if (res.type === 'executable' && res.rows) {
        setResult({ rows: res.rows, sql: res.sql, summary: res.summary });
        return;
      }

      setError(res.message || 'No data returned for this query.');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!result?.rows?.length) return;
    const file = await exportApi.exportCSV(result.rows, 'erp-report.csv');
    if (!file) return;
    const blob = new Blob([file.content], { type: file.mimeType });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.filename });
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-auto">

      {/* Header */}
      <div className="border-b border-border/50 px-6 py-5 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-blue-600 flex items-center justify-center shadow-md">
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">ERP Reports</h1>
            <p className="text-xs text-muted-foreground">Ask a question about your ERP data in plain English</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 space-y-5 max-w-3xl w-full mx-auto">

        {/* Query Input */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
          <div className="flex gap-3 items-start">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), runQuery())}
                placeholder="e.g. Show AP ageing by supplier for this month..."
                rows={2}
                className="w-full rounded-xl border border-transparent bg-black/5 dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm outline-none resize-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              onClick={() => runQuery()}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Run
            </button>
          </div>
        </div>

        {/* Quick Query Chips */}
        {!result && !denied && !error && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quick Queries</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUERIES.map(q => {
                const mod = ERP_MODULES.find(m => m.id === q.module);
                const Icon = mod?.icon;
                return (
                  <button
                    key={q.label}
                    onClick={() => runQuery(q.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-card text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all"
                  >
                    {Icon && <Icon className={`w-3 h-3 ${mod?.color}`} />}
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* States */}
        <AnimatePresence mode="wait">

          {/* Loading */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-14 gap-3"
            >
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your query…</p>
            </motion.div>
          )}

          {/* Access Denied */}
          {!loading && denied && (
            <motion.div
              key="denied"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex gap-4 items-start"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Module Access Restricted</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{denied}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  Contact your admin to request access to this module.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex gap-3 items-start"
            >
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Query Error</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Success Result */}
          {!loading && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">Result</p>
              </div>
              {result.summary && (
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{result.summary}</p>
              )}
              <ResultTable rows={result.rows} onExport={handleExport} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
