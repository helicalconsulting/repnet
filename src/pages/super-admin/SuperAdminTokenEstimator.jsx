import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calculator,
  Coins,
  Layers,
  Zap,
  TrendingDown,
  DollarSign,
  IndianRupee,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Info,
  Target,
  FlaskConical,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const PRESET_QUERIES = [
  { label: 'All suppliers', q: 'list of all suppliers' },
  { label: 'Top 10 customers', q: 'show top 10 customers by revenue this year' },
  { label: 'Aging invoices 6m', q: 'aging invoice summary last 6 months outstanding amounts grouped by customer' },
  { label: 'Sales order total', q: 'total sales order value for this quarter broken down by product category' },
  { label: 'Low stock alert', q: 'inventory items low stock alert below reorder level by warehouse' },
  { label: 'Monthly purchases', q: 'monthly purchase amounts grouped by supplier for last 12 months' },
];

// Cost config per model per 1M tokens [input, output]
const MODEL_COST_CONFIG = {
  'deepseek-chat':    { input: 0.14,  output: 0.28,  ctx: 128000, name: 'DeepSeek Chat V3' },
  'gpt-4o-mini':     { input: 0.15,  output: 0.60,  ctx: 128000, name: 'GPT-4o Mini' },
  'gpt-4o':          { input: 2.50,  output: 10.00, ctx: 128000, name: 'GPT-4o' },
  'claude-3-5-haiku':{ input: 0.80,  output: 4.00,  ctx: 200000, name: 'Claude 3.5 Haiku' },
};

const PRUNING_META = {
  smart_pruning: {
    expectedSchemaRange: [400, 1500],
    tablesMatched: '3–15 tables',
    color: 'emerald',
    icon: Zap,
  },
  full_schema: {
    expectedSchemaRange: [18000, 32000],
    tablesMatched: '1,300+ tables (Syspro)',
    color: 'amber',
    icon: Layers,
  },
};

function estimateTablesFromWords(wordCount) {
  if (wordCount <= 3) return { max: 3, desc: 'Very narrow — likely 1–3 tables' };
  if (wordCount <= 6) return { max: 6, desc: 'Narrow query — 2–6 tables' };
  if (wordCount <= 10) return { max: 10, desc: 'Moderate complexity — 4–10 tables' };
  if (wordCount <= 15) return { max: 15, desc: 'Multi-join query — 6–15 tables' };
  return { max: 25, desc: 'Complex analytical — 8–25 tables' };
}

const TOKENS_PER_TABLE = 55;
const CHARS_PER_TOKEN = 3.8;

function calcCost(promptTokens, completionTokens, modelKey) {
  const cfg = MODEL_COST_CONFIG[modelKey];
  if (!cfg) return { singleUsd: '0.000000', singleInr: '0.0000', k1Usd: '0.000', k10Usd: '0.00', k1Inr: '0.00', k10Inr: '0.0' };
  const inCost  = (promptTokens    / 1_000_000) * cfg.input;
  const outCost = (completionTokens / 1_000_000) * cfg.output;
  const single  = inCost + outCost;
  const inr     = single * 86;
  return {
    singleUsd: single.toFixed(6),
    singleInr: inr.toFixed(4),
    k1Usd:    (single * 1000).toFixed(3),
    k10Usd:   (single * 10000).toFixed(2),
    k1Inr:    (inr * 1000).toFixed(2),
    k10Inr:   (inr * 10000).toFixed(1),
  };
}

function ProgressBar({ segments }) {
  return (
    <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{ width: `${Math.max(0.5, seg.pct)}%` }}
          className={`h-full ${seg.color} transition-all duration-700`}
          title={`${seg.label}: ${seg.value?.toLocaleString()} tokens`}
        />
      ))}
    </div>
  );
}

function InfoBadge({ label, value, sub, color = 'zinc' }) {
  const colorMap = {
    zinc:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    rose:    'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-0.5">{label}</p>
      <p className="text-xl font-bold font-mono leading-none">{value}</p>
      {sub && <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SuperAdminTokenEstimator() {
  const [erpType, setErpType]                         = useState('syspro');
  const [query, setQuery]                             = useState('list of all suppliers');
  const [model, setModel]                             = useState('deepseek-chat');
  const [pruningMode, setPruningMode]                 = useState('smart_pruning');
  const [maxCompletionTokens, setMaxCompletionTokens] = useState(2048);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);

  const debounceRef = useRef(null);

  const fetchEstimation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.estimateTokens({
        erp_type: erpType,
        natural_language_query: query,
        model,
        pruning_mode: pruningMode,
        max_completion_tokens: Number(maxCompletionTokens) || 2048,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to estimate token consumption');
    } finally {
      setLoading(false);
    }
  }, [erpType, query, model, pruningMode, maxCompletionTokens]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchEstimation(); }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [fetchEstimation]);

  // ── Derived values ──────────────────────────────────────────────────
  const tc      = data?.token_counts;
  const costs   = data?.selected_model_costs;
  const cmp     = data?.comparison_unpruned;
  const byModel = data?.costs_by_model;

  const wordCount      = query.trim().split(/\s+/).filter(Boolean).length;
  const charCount      = query.length;
  const localQueryTk   = Math.ceil(charCount / CHARS_PER_TOKEN);
  const tableEst       = estimateTablesFromWords(wordCount);
  const localSchemaTk  = pruningMode === 'smart_pruning' ? tableEst.max * TOKENS_PER_TABLE : 25000;

  const promptTokens     = tc?.total_prompt_tokens    ?? (localQueryTk + localSchemaTk + 500);
  const completionTokens = tc?.max_completion_tokens  ?? maxCompletionTokens;
  const totalTokens      = tc?.total_estimated_tokens ?? (promptTokens + completionTokens);
  const sysTokens        = tc?.system_base_tokens     ?? 500;
  const schemaTokens     = tc?.context_schema_tokens  ?? localSchemaTk;
  const userQueryTk      = tc?.user_query_tokens      ?? localQueryTk;

  const costBreakdown = calcCost(promptTokens, completionTokens, model);
  const ctxWindow     = MODEL_COST_CONFIG[model]?.ctx ?? 128000;
  const ctxUtilPct    = Math.min(100, (totalTokens / ctxWindow) * 100).toFixed(1);

  const barSegments = [
    { label: 'System Instructions', value: sysTokens,       pct: (sysTokens / totalTokens) * 100,       color: 'bg-blue-500' },
    { label: 'ERP Schema Context',  value: schemaTokens,    pct: (schemaTokens / totalTokens) * 100,     color: 'bg-amber-500' },
    { label: 'User Query',          value: userQueryTk,     pct: (userQueryTk / totalTokens) * 100,      color: 'bg-purple-500' },
    { label: 'Max Completion',      value: completionTokens,pct: (completionTokens / totalTokens) * 100, color: 'bg-emerald-500' },
  ];

  const pruningMeta = PRUNING_META[pruningMode];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 px-6 pt-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            LLM Token &amp; Cost Estimator
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time accurate breakdown: system prompt + semantic schema pruning + query tokens + model pricing.
            {!data && !loading && <span className="text-amber-500 ml-2">⚠ Uses local heuristics until API responds</span>}
            {data && tc && <span className="text-emerald-500 ml-2">✓ Live API data</span>}
          </p>
        </div>
        <button
          onClick={fetchEstimation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Estimating…' : 'Recalculate'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ── LEFT: Inputs ── */}
        <div className="xl:col-span-4 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40 font-semibold text-sm">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              Simulation Parameters
            </div>

            {/* ERP Adapter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ERP Adapter</label>
              <select
                value={erpType}
                onChange={(e) => setErpType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 font-medium"
              >
                <option value="syspro">Syspro ERP (1,300+ Tables)</option>
                <option value="sap">SAP S/4HANA (Universal)</option>
                <option value="epicor">Epicor ERP</option>
                <option value="helios">Helios Cloud ERP</option>
              </select>
            </div>

            {/* NL Query */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Natural Language Query</label>
                <span className="text-[11px] font-mono text-muted-foreground">{wordCount}w · ~{localQueryTk}tk</span>
              </div>
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. list of all suppliers…"
                className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
              />
              <div className="flex items-start gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <Target className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>{wordCount} words</strong> → {tableEst.desc}
                  {pruningMode === 'smart_pruning' && (
                    <> → ~<strong>{tableEst.max * TOKENS_PER_TABLE} schema tokens</strong></>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(pq.q)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors font-medium border border-border/40"
                  >
                    {pq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LLM Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LLM Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 font-semibold"
              >
                <option value="deepseek-chat">DeepSeek Chat V3 — $0.14/$0.28 per 1M</option>
                <option value="gpt-4o-mini">GPT-4o Mini — $0.15/$0.60 per 1M</option>
                <option value="gpt-4o">GPT-4o — $2.50/$10.00 per 1M</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku — $0.80/$4.00 per 1M</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                Context: <strong>{(ctxWindow / 1000).toFixed(0)}K tokens</strong>
                &nbsp;· Input: <strong>${MODEL_COST_CONFIG[model]?.input}/M</strong>
                &nbsp;· Output: <strong>${MODEL_COST_CONFIG[model]?.output}/M</strong>
              </p>
            </div>

            {/* Context Strategy */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Context Strategy</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRUNING_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const isActive = pruningMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPruningMode(key)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10 shadow-sm'
                          : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                        <Icon className={`w-3.5 h-3.5 text-${meta.color}-500`} />
                        {key === 'smart_pruning' ? 'Smart Pruning' : 'Full Schema'}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1.5">{meta.tablesMatched}</span>
                      <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                        ~{(meta.expectedSchemaRange[0] / 1000).toFixed(0)}–{(meta.expectedSchemaRange[1] / 1000).toFixed(0)}k schema tkns
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output Tokens Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Max Output Tokens</label>
                <span className="font-mono font-bold text-foreground px-2 py-0.5 bg-muted rounded-lg text-xs">
                  {maxCompletionTokens.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={256}
                max={4096}
                step={128}
                value={maxCompletionTokens}
                onChange={(e) => setMaxCompletionTokens(Number(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>256</span>
                <span>~${((maxCompletionTokens / 1_000_000) * (MODEL_COST_CONFIG[model]?.output ?? 0.28)).toFixed(5)} output/query</span>
                <span>4096</span>
              </div>
            </div>
          </div>

          {/* Inference Chain */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-muted-foreground" />
              Query → Token Inference Chain
            </h3>
            <div className="space-y-1.5 text-xs">
              {[
                {
                  step: '① User Query',
                  detail: `"${query.slice(0, 48)}${query.length > 48 ? '…' : ''}"`,
                  meta: `${wordCount} words · ~${localQueryTk} tokens`,
                  cls: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20',
                },
                {
                  step: '② Schema Retrieval',
                  detail: pruningMode === 'smart_pruning'
                    ? `Semantic embedding match → ${tableEst.desc}`
                    : 'Full ERP schema injected (1,300+ tables)',
                  meta: `~${schemaTokens.toLocaleString()} tokens`,
                  cls: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20',
                },
                {
                  step: '③ System Instructions',
                  detail: 'Base system prompt: SQL gen rules, output format, constraints',
                  meta: `~${sysTokens} tokens`,
                  cls: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
                },
                {
                  step: '④ Total Prompt',
                  detail: 'System + Schema + Query assembled into context window',
                  meta: `${promptTokens.toLocaleString()} tokens total`,
                  cls: 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30',
                },
                {
                  step: '⑤ LLM Output Budget',
                  detail: `${MODEL_COST_CONFIG[model]?.name} generates SQL + summary`,
                  meta: `max ${completionTokens.toLocaleString()} tokens`,
                  cls: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',
                },
              ].map((item, idx) => (
                <div key={idx} className={`rounded-lg border p-2.5 ${item.cls}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{item.step}</span>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">{item.meta}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="xl:col-span-8 space-y-5">

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoBadge
              label="Prompt Tokens"
              value={loading ? '…' : promptTokens.toLocaleString()}
              sub={`${sysTokens} sys · ${schemaTokens.toLocaleString()} schema · ${userQueryTk} query`}
              color="blue"
            />
            <InfoBadge
              label="Total Est. Tokens"
              value={loading ? '…' : totalTokens.toLocaleString()}
              sub={`prompt + ${completionTokens.toLocaleString()} output`}
              color="purple"
            />
            <InfoBadge
              label="Cost / Query"
              value={loading ? '…' : `$${costs?.single_query_usd ?? costBreakdown.singleUsd}`}
              sub={`₹${costs?.single_query_inr ?? costBreakdown.singleInr} · ${MODEL_COST_CONFIG[model]?.name}`}
              color="emerald"
            />
            <InfoBadge
              label="Context Window Used"
              value={loading ? '…' : `${ctxUtilPct}%`}
              sub={`of ${(ctxWindow / 1000).toFixed(0)}K token window`}
              color={ctxUtilPct > 80 ? 'rose' : ctxUtilPct > 50 ? 'amber' : 'zinc'}
            />
          </div>

          {/* Smart Pruning Banner */}
          {pruningMode === 'smart_pruning' && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2">
                    Smart Pruning Active
                    {cmp?.savings_percentage && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        −{cmp.savings_percentage}% vs full schema
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only semantically relevant tables loaded into context.
                    {cmp?.tokens_saved && (
                      <> Saves <span className="font-mono font-semibold text-foreground">{cmp.tokens_saved?.toLocaleString()}</span> tokens/query.</>
                    )}
                  </p>
                </div>
              </div>
              {cmp && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">At 10,000 Queries</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +${cmp?.cost_savings_usd_10k?.toLocaleString()} saved
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">₹{cmp?.cost_savings_inr_10k?.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Token Allocation Bar */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                Token Allocation Breakdown
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">
                {tc ? '✓ Live API data' : '⚠ Local estimate'}
              </span>
            </div>

            <ProgressBar segments={barSegments} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { dot: 'bg-blue-500',    label: 'System Instructions', val: sysTokens,        pct: ((sysTokens / totalTokens) * 100).toFixed(1) },
                { dot: 'bg-amber-500',   label: 'ERP Schema Context',  val: schemaTokens,     pct: ((schemaTokens / totalTokens) * 100).toFixed(1) },
                { dot: 'bg-purple-500',  label: 'User Query',          val: userQueryTk,      pct: ((userQueryTk / totalTokens) * 100).toFixed(1) },
                { dot: 'bg-emerald-500', label: 'Output Budget',       val: completionTokens, pct: ((completionTokens / totalTokens) * 100).toFixed(1) },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                    <span className="text-muted-foreground text-[10px] font-semibold truncate">{item.label}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground text-sm">{item.val?.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">{item.pct}% of total</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Drilldown */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Cost Drilldown — {MODEL_COST_CONFIG[model]?.name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: '1 Query',       usd: costs?.single_query_usd   ?? costBreakdown.singleUsd, inr: costs?.single_query_inr   ?? costBreakdown.singleInr, highlight: false },
                { label: '1,000 Queries', usd: costs?.queries_1k_usd     ?? costBreakdown.k1Usd,     inr: costs?.queries_1k_inr     ?? costBreakdown.k1Inr,     highlight: false },
                { label: '10,000 Queries',usd: costs?.queries_10k_usd    ?? costBreakdown.k10Usd,    inr: costs?.queries_10k_inr    ?? costBreakdown.k10Inr,    highlight: true  },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border flex flex-col gap-1 ${
                    item.highlight
                      ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  <span className="text-2xl font-bold font-mono text-foreground">${item.usd}</span>
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />₹{item.inr}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex justify-between">
                <span>Input cost ({promptTokens.toLocaleString()} tokens × ${MODEL_COST_CONFIG[model]?.input}/M)</span>
                <span className="font-mono font-semibold text-foreground">
                  ${((promptTokens / 1_000_000) * (MODEL_COST_CONFIG[model]?.input ?? 0)).toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Output cost ({completionTokens.toLocaleString()} tokens × ${MODEL_COST_CONFIG[model]?.output}/M)</span>
                <span className="font-mono font-semibold text-foreground">
                  ${((completionTokens / 1_000_000) * (MODEL_COST_CONFIG[model]?.output ?? 0)).toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1 font-bold text-foreground text-xs">
                <span>Total per query</span>
                <span className="font-mono">${costs?.single_query_usd ?? costBreakdown.singleUsd}</span>
              </div>
            </div>
          </div>

          {/* Multi-Model Comparison */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Coins className="w-4 h-4 text-muted-foreground" />
                Multi-Model Cost Comparison
              </h3>
              <span className="text-[10px] text-muted-foreground">
                $1 = ₹86 · Same {promptTokens.toLocaleString()} prompt tokens
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-widest">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Input/1M</th>
                    <th className="py-2.5 px-3">1 Query</th>
                    <th className="py-2.5 px-3">1K Queries</th>
                    <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">10K Queries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {byModel
                    ? Object.entries(byModel).map(([mKey, cData]) => {
                        const isSelected = mKey === model;
                        return (
                          <tr key={mKey} className={`transition-colors ${isSelected ? 'bg-zinc-900/5 dark:bg-zinc-100/10' : 'hover:bg-muted/30'}`}>
                            <td className="py-3 px-3 font-sans font-semibold text-foreground">
                              <div className="flex items-center gap-1.5">
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                {cData.model_name}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">${MODEL_COST_CONFIG[mKey]?.input ?? '—'}</td>
                            <td className="py-3 px-3 text-foreground">${cData.single_query_usd} <span className="text-muted-foreground text-[10px]">(₹{cData.single_query_inr})</span></td>
                            <td className="py-3 px-3 text-foreground">${cData.queries_1k_usd} <span className="text-muted-foreground text-[10px]">(₹{cData.queries_1k_inr})</span></td>
                            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">${cData.queries_10k_usd} <span className="text-muted-foreground font-normal text-[10px]">(₹{cData.queries_10k_inr})</span></td>
                          </tr>
                        );
                      })
                    : Object.entries(MODEL_COST_CONFIG).map(([mKey, cfg]) => {
                        const isSelected = mKey === model;
                        const cb = calcCost(promptTokens, completionTokens, mKey);
                        return (
                          <tr key={mKey} className={`transition-colors ${isSelected ? 'bg-zinc-900/5 dark:bg-zinc-100/10' : 'hover:bg-muted/30'}`}>
                            <td className="py-3 px-3 font-sans font-semibold text-foreground">
                              <div className="flex items-center gap-1.5">
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                {cfg.name}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">${cfg.input}</td>
                            <td className="py-3 px-3 text-foreground">${cb.singleUsd} <span className="text-muted-foreground text-[10px]">(₹{cb.singleInr})</span></td>
                            <td className="py-3 px-3 text-foreground">${cb.k1Usd} <span className="text-muted-foreground text-[10px]">(₹{cb.k1Inr})</span></td>
                            <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">${cb.k10Usd} <span className="text-muted-foreground font-normal text-[10px]">(₹{cb.k10Inr})</span></td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/40">
              <Info className="w-3 h-3 shrink-0" />
              {tc ? 'Values computed from live API token counts.' : 'Local heuristic estimate (1 token ≈ 3.8 chars, 55 tokens/table). API data takes priority when available.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
