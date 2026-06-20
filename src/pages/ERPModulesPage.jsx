import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Package, Factory, Warehouse,
  FileText, TrendingUp, CreditCard, BookOpen, Truck,
  ClipboardList, ReceiptText, Boxes, Layers, BarChart3,
  ChevronRight, Lock, Play, Download, X, Loader2,
  AlertCircle, CheckCircle2, Shield, Edit3, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryApi, exportApi, organizationApi } from '../services/api';

// ── ERP Module definitions ───────────────────────────────────────────────────
const ERP_MODULES = [
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    allowedRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'ar', label: 'Accounts Receivable', icon: TrendingUp, description: 'Track customer invoices & collections', query: 'Show accounts receivable ageing report' },
      { id: 'ap', label: 'Accounts Payable', icon: CreditCard, description: 'Manage vendor payments & liabilities', query: 'Show accounts payable summary by vendor' },
      { id: 'cashbook', label: 'Cash Book', icon: BookOpen, description: 'Daily cash inflow & outflow entries', query: 'Show cash book transactions for this month' },
      { id: 'gl', label: 'General Ledger', icon: FileText, description: 'Full chart of accounts & journal entries', query: 'Show general ledger trial balance' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    allowedRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'sorder', label: 'Sales Order', icon: ClipboardList, description: 'Create & track customer sales orders', query: 'Show all open sales orders with status' },
      { id: 'sinvoice', label: 'Sales Invoice', icon: ReceiptText, description: 'Generate & manage sales invoices', query: 'Show sales invoice summary by customer' },
      { id: 'dispatch', label: 'Dispatch', icon: Truck, description: 'Delivery scheduling & shipment tracking', query: 'Show pending dispatches and delivery status' },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: Package,
    color: 'from-orange-500 to-amber-600',
    bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    allowedRoles: ['admin', 'editor'],
    subModules: [
      { id: 'porder', label: 'Purchase Order', icon: ClipboardList, description: 'Raise & approve purchase orders', query: 'Show all purchase orders with approval status' },
      { id: 'pinvoice', label: 'Purchase Invoice', icon: ReceiptText, description: 'Process vendor invoices & bills', query: 'Show purchase invoice aging by supplier' },
      { id: 'grn', label: 'GRN', icon: Boxes, description: 'Goods received notes & inspection', query: 'Show goods received notes pending verification' },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    color: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800',
    allowedRoles: ['admin', 'editor'],
    subModules: [
      { id: 'bom', label: 'Bill of Material', icon: Layers, description: 'Product BOM structure & components', query: 'Show bill of materials for all products' },
      { id: 'wip', label: 'Work in Progress', icon: Factory, description: 'Active production orders & WIP tracking', query: 'Show work in progress production status' },
      { id: 'jobcosting', label: 'Job Costing', icon: BarChart3, description: 'Job-level cost tracking & variance', query: 'Show job costing report with actual vs budgeted cost' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    color: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
    allowedRoles: ['admin', 'editor', 'viewer'],
    subModules: [
      { id: 'invvaluation', label: 'Inventory Valuation', icon: TrendingUp, description: 'Stock value by FIFO / Weighted Avg', query: 'Show inventory valuation report by item' },
      { id: 'invholding', label: 'Inventory Holding', icon: Warehouse, description: 'Stock on hand, days on hand analysis', query: 'Show inventory holding summary with days on hand' },
    ],
  },
];

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  editor: { label: 'Editor', icon: Edit3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

// ── Report Generation Modal ──────────────────────────────────────────────────
function ReportModal({ subModule, module, onClose }) {
  const { activeConnection, connections } = useApp();
  const navigate = useNavigate();

  // stage: idle | loading | executable | params_needed | template_preview | error | access_denied
  const [stage, setStage] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  // For params_needed — user fills in missing params
  const [paramValues, setParamValues] = useState({});

  const connId = activeConnection || connections[0]?.id;

  // Build enriched NL query: prepend module+submodule context so the backend's
  // _detect_module_from_query() and Pinecone search get a strong signal.
  const buildEnrichedQuery = (extraContext = '') => {
    const base = `[Module: ${module.label}] [Report: ${subModule.label}] ${subModule.query}`;
    return extraContext ? `${base} ${extraContext}` : base;
  };

  const runReport = async (overrideQuery) => {
    if (!connId) {
      setErrorMsg('No active database connection. Connect a database from the Connections page first.');
      setStage('error');
      return;
    }
    setStage('loading');
    setErrorMsg('');
    try {
      const res = await queryApi.chat({
        naturalLanguage: overrideQuery || buildEnrichedQuery(),
        connectionId: connId,
      });

      setResult(res);

      // Route to the correct UI stage based on backend response type
      if (res.type === 'access_denied') {
        setErrorMsg(res.message || 'You do not have permission to access this module.');
        setStage('access_denied');
      } else if (res.type === 'executable') {
        setStage('executable');
      } else if (res.type === 'params_needed') {
        // Pre-fill already-extracted params from AI
        const prefilled = {};
        (res.missing_params || []).forEach(p => {
          prefilled[p.name] = res.extracted_params?.[p.name] ?? p.default ?? '';
        });
        setParamValues(prefilled);
        setStage('params_needed');
      } else if (res.type === 'template_preview') {
        setStage('template_preview');
      } else if (res.type === 'error') {
        setErrorMsg(res.message || 'AI could not match a report template.');
        setStage('error');
      } else {
        // conversational fallback — still show what AI said
        setStage('executable');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate report');
      setStage('error');
    }
  };

  // Called when user submits the params form
  const submitParams = async () => {
    if (!result?.template_id) return;
    setStage('loading');
    try {
      const res = await queryApi.execute({
        templateId: result.template_id,
        params: paramValues,
        connectionId: connId,
      });
      setResult(res);
      setStage(res.type === 'executable' ? 'executable' : 'error');
      if (res.type === 'error') setErrorMsg(res.message || 'Execution failed');
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed');
      setStage('error');
    }
  };

  const handleExport = async (format) => {
    if (!result) return;
    setExporting(true);
    try {
      const headers = result.rows?.length ? Object.keys(result.rows[0]) : [];
      const rows = result.rows || [];
      if (format === 'excel') {
        const out = await exportApi.exportExcel({ title: subModule.label, headers, rows });
        triggerDownload(out.content, out.filename);
      } else if (format === 'pdf') {
        const out = await exportApi.exportPDF({ title: subModule.label, headers, rows });
        triggerDownload(out.content, out.filename);
      } else {
        const out = await exportApi.exportCSV(rows, `${subModule.id}_report.csv`);
        triggerDownload(new Blob([out.content], { type: 'text/csv' }), out.filename);
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  };

  const rows = result?.rows || [];
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="bg-background border border-border/60 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b border-border/50 bg-gradient-to-r ${module.color} bg-opacity-10`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <subModule.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{subModule.label}</h2>
              <p className="text-white/70 text-xs">{module.label} Module · {subModule.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {/* Enriched query chip */}
          <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border/40 flex items-start gap-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground italic">"{subModule.query}"</p>
              {result?.template_id && (
                <p className="text-[10px] text-primary/70 mt-1 font-medium">
                  Template matched: {result.template_id}
                  {result.template_module ? ` · ${result.template_module}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* ── IDLE ── */}
          {stage === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${module.bgLight}`}>
                <subModule.icon className={`w-8 h-8 ${module.textColor}`} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Ready to Generate</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will classify your intent and find the best matching report template
                </p>
              </div>
              <button
                onClick={() => runReport()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${module.color} text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity`}
              >
                <Play className="w-4 h-4" /> Run Report
              </button>
            </div>
          )}

          {/* ── LOADING ── */}
          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className={`w-10 h-10 animate-spin ${module.textColor}`} />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">AI is processing your request...</p>
                <p className="text-xs text-muted-foreground">Classifying intent → Matching template → Executing query</p>
              </div>
            </div>
          )}

          {/* ── ACCESS DENIED — backend RBAC blocked this query ── */}
          {stage === 'access_denied' && (
            <div className="flex flex-col items-center justify-center py-14 gap-5">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${module.color} opacity-10 absolute inset-0`} />
                <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 flex items-center justify-center relative">
                  <Lock className="w-9 h-9 text-amber-500" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <p className="font-bold text-foreground text-base">Module Access Restricted</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{errorMsg}</p>
                {result?.template_module && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full inline-block">
                    Detected module: <span className="font-bold">{result.template_module.toUpperCase()}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                {(result?.suggestions || []).map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground bg-muted/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
              <div className="text-center max-w-md">
                <p className="font-semibold text-foreground">Report Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => runReport()} className="text-sm text-primary hover:underline font-medium">
                  Try again
                </button>
                {!connId && (
                  <button
                    onClick={() => { onClose(); navigate('/connections'); }}
                    className="text-sm text-blue-500 hover:underline font-medium"
                  >
                    → Connect a Database
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── PARAMS NEEDED — AI matched template but needs more info ── */}
          {stage === 'params_needed' && result && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    AI matched: <span className="font-bold">{result.template_description || result.template_id}</span>
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                    Please provide the required parameters to execute this report.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(result.missing_params || []).map(param => (
                  <div key={param.name} className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground capitalize flex items-center gap-1">
                      {param.name.replace(/_/g, ' ')}
                      {param.required && <span className="text-rose-500">*</span>}
                    </label>
                    {param.description && (
                      <p className="text-[10px] text-muted-foreground">{param.description}</p>
                    )}
                    {param.options?.length > 0 ? (
                      <select
                        value={paramValues[param.name] ?? ''}
                        onChange={e => setParamValues(v => ({ ...v, [param.name]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm outline-none focus:border-primary/50 transition-colors"
                      >
                        <option value="">Select...</option>
                        {param.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={param.type === 'int' || param.type === 'float' ? 'number' : 'text'}
                        value={paramValues[param.name] ?? ''}
                        onChange={e => setParamValues(v => ({ ...v, [param.name]: e.target.value }))}
                        placeholder={param.default != null ? `Default: ${param.default}` : `Enter ${param.name}...`}
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm outline-none focus:border-primary/50 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TEMPLATE PREVIEW — no DB connected ── */}
          {stage === 'template_preview' && result && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  ✅ Template matched: {result.template_description || result.template_id}
                </p>
                <p className="text-xs text-blue-500/80 mt-1">
                  No database connected. Connect a database to execute this report.
                </p>
              </div>
              {result.sql && (
                <div className="rounded-xl border border-border/50 overflow-auto bg-muted/30">
                  <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SQL Preview</span>
                  </div>
                  <pre className="p-3 text-xs text-foreground/80 overflow-auto max-h-40 font-mono">{result.sql}</pre>
                </div>
              )}
              <button
                onClick={() => { onClose(); navigate('/connections'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${module.color} text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity`}
              >
                Connect a Database →
              </button>
            </div>
          )}

          {/* ── EXECUTABLE — data returned ── */}
          {stage === 'executable' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  {rows.length} row{rows.length !== 1 ? 's' : ''} returned
                  {result.execution_time_ms ? ` · ${result.execution_time_ms}ms` : ''}
                  {result.template_description ? ` · ${result.template_description}` : ''}
                </p>
              </div>

              {result.summary && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">AI Insight</p>
                  <p className="text-sm text-foreground/80">{result.summary}</p>
                </div>
              )}

              {result.message && !result.summary && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-sm text-foreground/70">{result.message}</p>
                </div>
              )}

              {rows.length > 0 ? (
                <div className="rounded-xl border border-border/50 overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {headers.map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-semibold text-muted-foreground border-b border-border/40 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          {headers.map(h => (
                            <td key={h} className="px-3 py-2 text-foreground/80 whitespace-nowrap">
                              {row[h] == null ? '—' : String(row[h])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Query ran successfully but returned no data.
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Reports</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions.slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => runReport(s)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            {stage === 'executable' && rows.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground font-medium">Export:</span>
                {['excel', 'pdf', 'csv'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    disabled={exporting}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 ${
                      fmt === 'excel' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' :
                      fmt === 'pdf'   ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20' :
                                        'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* params form submit */}
            {stage === 'params_needed' && (
              <button
                onClick={submitParams}
                className={`px-5 py-2 rounded-xl bg-gradient-to-r ${module.color} text-white text-xs font-bold shadow hover:opacity-90 transition-opacity flex items-center gap-1.5`}
              >
                <Play className="w-3.5 h-3.5" /> Execute
              </button>
            )}
            {stage === 'executable' && (
              <button
                onClick={() => runReport()}
                className="px-4 py-2 rounded-xl border border-border/50 text-xs font-semibold hover:bg-muted/40 transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Re-run
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-muted/40 hover:bg-muted text-xs font-semibold transition-colors">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sub-module Card ──────────────────────────────────────────────────────────
function SubModuleCard({ sub, module, canAccess, index }) {
  const [showModal, setShowModal] = useState(false);
  const Icon = sub.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        onClick={() => canAccess && setShowModal(true)}
        className={`group relative rounded-xl border p-4 transition-all duration-200 ${
          canAccess
            ? `${module.borderColor} hover:shadow-md cursor-pointer hover:scale-[1.02] bg-card`
            : 'border-border/30 bg-muted/20 cursor-not-allowed opacity-60'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${canAccess ? module.bgLight : 'bg-muted'}`}>
            {canAccess
              ? <Icon className={`w-4.5 h-4.5 ${module.textColor}`} />
              : <Lock className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground truncate">{sub.label}</p>
              {!canAccess && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium shrink-0">
                  Restricted
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sub.description}</p>
          </div>
        </div>
        {canAccess && (
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${module.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <Play className="w-3 h-3" />
            Generate Report
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ReportModal
            subModule={sub}
            module={module}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Helper to check user-level permissions override or fallback to role
function checkModuleAccess(module, user) {
  if (!user) return false;
  if (user.module_permissions) {
    const override = user.module_permissions[module.id];
    if (override !== undefined) {
      return !!override;
    }
  }
  const userRole = user.role || 'viewer';
  return module.allowedRoles.includes(userRole);
}

// ── User Access Control Modal ────────────────────────────────────────────────
function UserAccessModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await organizationApi.listMembers();
        setUsers(data || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleToggle = async (targetUser, moduleId) => {
    const currentPerms = targetUser.module_permissions || {};
    const moduleObj = ERP_MODULES.find(m => m.id === moduleId);
    const defaultAllowed = moduleObj ? moduleObj.allowedRoles.includes(targetUser.role) : false;
    const currentVal = currentPerms[moduleId] !== undefined ? currentPerms[moduleId] : defaultAllowed;
    const newVal = !currentVal;

    const updatedPerms = { ...currentPerms, [moduleId]: newVal };
    setUpdatingUserId(`${targetUser.id}-${moduleId}`);

    try {
      await organizationApi.updatePermissions(targetUser.id, updatedPerms);
      setUsers(prev => prev.map(u => {
        if (u.id === targetUser.id) {
          return { ...u, module_permissions: updatedPerms };
        }
        return u;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-border/80 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-blue-500" />
            <h2 className="font-bold text-foreground text-sm">User Access Control</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/40 bg-muted/10 gap-3">
                <div>
                  <p className="font-semibold text-xs text-foreground">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">{u.role}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ERP_MODULES.map(m => {
                    const hasOverride = u.module_permissions?.[m.id] !== undefined;
                    const isAllowed = hasOverride ? u.module_permissions[m.id] : m.allowedRoles.includes(u.role);
                    const isUpdating = updatingUserId === `${u.id}-${m.id}`;
                    return (
                      <button
                        key={m.id}
                        disabled={isUpdating}
                        onClick={() => handleToggle(u, m.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                          isAllowed
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/25'
                            : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20'
                        }`}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : isAllowed ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-2.5 h-2.5" />}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ module, index }) {
  const { user } = useApp();
  const [expanded, setExpanded] = useState(false);
  const Icon = module.icon;
  const canAccess = checkModuleAccess(module, user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border overflow-hidden ${canAccess ? 'border-border/60 bg-card' : 'border-border/30 bg-muted/10'}`}
    >
      {/* Module Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-5 transition-all ${
          canAccess ? 'hover:bg-muted/20' : 'cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground text-base">{module.label}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{module.subModules.length} sub-modules</span>
              {!canAccess && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                  Access Restricted
                </span>
              )}
              {canAccess && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${module.bgLight} ${module.textColor}`}>
                  {module.allowedRoles.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
        {canAccess && (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Sub-modules grid */}
      <AnimatePresence>
        {expanded && canAccess && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t ${module.borderColor}`}>
              {module.subModules.map((sub, i) => (
                <SubModuleCard
                  key={sub.id}
                  sub={sub}
                  module={module}
                  canAccess={canAccess}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ERPModulesPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const userRole = user?.role || 'viewer';
  const roleConf = ROLE_CONFIG[userRole] || ROLE_CONFIG.viewer;
  const RoleIcon = roleConf.icon;

  const [showAccessModal, setShowAccessModal] = useState(false);
  const accessibleCount = ERP_MODULES.filter(m => checkModuleAccess(m, user)).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-6 py-5 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-blue-600 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ERP Modules</h1>
              <p className="text-xs text-muted-foreground">
                {accessibleCount} of {ERP_MODULES.length} modules accessible
              </p>
            </div>
          </div>
          {/* Role Badge & Manage Button */}
          <div className="flex items-center gap-2.5">
            {userRole === 'admin' && (
              <button
                onClick={() => setShowAccessModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border/60 hover:bg-muted/40 bg-card transition-all text-muted-foreground hover:text-foreground shadow-sm cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Manage User Access
              </button>
            )}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/50 ${roleConf.bg}`}>
              <RoleIcon className={`w-4 h-4 ${roleConf.color}`} />
              <span className={`text-sm font-semibold ${roleConf.color}`}>{roleConf.label}</span>
              <span className="text-xs text-muted-foreground">access level</span>
            </div>
          </div>
        </div>

        {/* Role legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {Object.entries(ROLE_CONFIG).map(([role, conf]) => {
            const Ic = conf.icon;
            return (
              <div key={role} className={`flex items-center gap-1.5 text-xs ${userRole === role ? conf.color : 'text-muted-foreground'}`}>
                <Ic className="w-3 h-3" />
                <span className="font-medium">{conf.label}</span>
                {userRole === role && <span className="text-[10px] font-bold">(You)</span>}
              </div>
            );
          })}
          <span className="text-[11px] text-muted-foreground">· Click a module to expand · Click a sub-module to generate report</span>
        </div>
      </div>

      {/* Modules */}
      <div className="flex-1 p-6 space-y-4 pb-12">
        {ERP_MODULES.map((module, i) => (
          <ModuleCard
            key={module.id}
            module={module}
            index={i}
          />
        ))}
      </div>

      <AnimatePresence>
        {showAccessModal && (
          <UserAccessModal onClose={() => setShowAccessModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
