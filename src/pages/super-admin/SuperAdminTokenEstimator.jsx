import { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  TrendingDown,
  Info,
  DollarSign,
  IndianRupee,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

const PRESET_QUERIES = [
  'list of all suppliers',
  'show top 10 customers by revenue',
  'aging invoice summary last 6 months',
  'total sales order value for this quarter',
  'inventory items low stock alert'
];

export default function SuperAdminTokenEstimator() {
  const [erpType, setErpType] = useState('syspro');
  const [query, setQuery] = useState('list of all suppliers');
  const [model, setModel] = useState('deepseek-chat');
  const [pruningMode, setPruningMode] = useState('smart_pruning');
  const [maxCompletionTokens, setMaxCompletionTokens] = useState(2048);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchEstimation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.estimateTokens({
        erp_type: erpType,
        natural_language_query: query,
        model: model,
        pruning_mode: pruningMode,
        max_completion_tokens: Number(maxCompletionTokens) || 2048,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to estimate tokens:', err);
      setError(err.message || 'Failed to estimate token consumption');
    } finally {
      setLoading(false);
    }
  }, [erpType, query, model, pruningMode, maxCompletionTokens]);

  useEffect(() => {
    fetchEstimation();
  }, [fetchEstimation]);

  const selectedCost = data?.selected_model_costs;
  const comparison = data?.comparison_unpruned;
  const tokenCounts = data?.token_counts;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            LLM Token & Cost Estimator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate and analyze prompt tokens, ERP schema context sizes, and cost models across LLMs.
          </p>
        </div>

        <button
          onClick={fetchEstimation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculate
        </button>
      </div>

      {/* Control Form & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs Column */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40 font-semibold text-sm">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            Simulation Parameters
          </div>

          {/* ERP Adapter Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ERP Adapter / Database
            </label>
            <select
              value={erpType}
              onChange={(e) => setErpType(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 font-medium"
            >
              <option value="syspro">Syspro ERP (1300+ Tables)</option>
              <option value="sap">SAP S/4HANA (Universal)</option>
              <option value="epicor">Epicor ERP</option>
              <option value="helios">Helios Cloud ERP</option>
            </select>
          </div>

          {/* Natural Language Query Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Natural Language Query
            </label>
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter NL query (e.g. list of all suppliers)..."
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none font-sans"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium py-0.5">Quick Presets:</span>
              {PRESET_QUERIES.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(pq)}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors font-medium border border-border/40"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>

          {/* LLM Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              LLM Model Architecture
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-500 font-semibold"
            >
              <option value="deepseek-chat">DeepSeek Chat V3 ($0.14 / $0.28 per 1M)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini ($0.15 / $0.60 per 1M)</option>
              <option value="gpt-4o">OpenAI GPT-4o ($2.50 / $10.00 per 1M)</option>
              <option value="claude-3-5-haiku">Claude 3.5 Haiku ($0.80 / $4.00 per 1M)</option>
            </select>
          </div>

          {/* Pruning Strategy Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Context Strategy Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPruningMode('smart_pruning')}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  pruningMode === 'smart_pruning'
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10 font-bold'
                    : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  Smart Pruning
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Matched schemas (~800 tokens)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPruningMode('full_schema')}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  pruningMode === 'full_schema'
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10 font-bold'
                    : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Full Schema
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">
                  All ERP tables (~25k tokens)
                </span>
              </button>
            </div>
          </div>

          {/* Max Completion Limit Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                Max Completion Tokens Limit
              </span>
              <span className="font-mono font-bold text-foreground px-2 py-0.5 bg-muted rounded">
                {maxCompletionTokens} tokens
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
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Prompt Tokens Card */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Prompt Tokens</span>
                <Cpu className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-foreground font-mono">
                  {tokenCounts?.total_prompt_tokens?.toLocaleString() || 0}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Chars: {data?.character_counts?.total_prompt?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Total Query Tokens Card */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Max Total Tokens</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-foreground font-mono">
                  {tokenCounts?.total_estimated_tokens?.toLocaleString() || 0}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Prompt + {tokenCounts?.max_completion_tokens || 0} output
                </div>
              </div>
            </div>

            {/* Single Query Cost Card */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Cost / Query</span>
                <Coins className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${selectedCost?.single_query_usd || '0.0000'}
                </div>
                <div className="text-[11px] font-semibold text-foreground/80 mt-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  ₹{selectedCost?.single_query_inr || '0.00'} per execution
                </div>
              </div>
            </div>
          </div>

          {/* Smart Pruning Savings Banner */}
          {pruningMode === 'smart_pruning' && comparison && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Smart Pruning Optimization Active
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      -{comparison.savings_percentage}% Tokens Saved
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Saved <span className="font-mono font-semibold text-foreground">{comparison.tokens_saved?.toLocaleString()} tokens</span> per query compared to loading all 1,300 ERP tables.
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-muted-foreground font-medium">10,000 Queries Savings</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +${comparison.cost_savings_usd_10k?.toLocaleString()} (₹{comparison.cost_savings_inr_10k?.toLocaleString()})
                </div>
              </div>
            </div>
          )}

          {/* Token Allocation Visual Breakdown Bar */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              Prompt Token Allocation Breakdown
            </h3>

            {/* Visual Bar */}
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(5, (tokenCounts?.system_base_tokens / (tokenCounts?.total_estimated_tokens || 1)) * 100)}%` }}
                className="bg-blue-500 h-full"
                title={`Base System Instructions: ${tokenCounts?.system_base_tokens} tokens`}
              />
              <div
                style={{ width: `${Math.max(5, (tokenCounts?.context_schema_tokens / (tokenCounts?.total_estimated_tokens || 1)) * 100)}%` }}
                className="bg-amber-500 h-full"
                title={`ERP Schema Context: ${tokenCounts?.context_schema_tokens} tokens`}
              />
              <div
                style={{ width: `${Math.max(3, (tokenCounts?.user_query_tokens / (tokenCounts?.total_estimated_tokens || 1)) * 100)}%` }}
                className="bg-purple-500 h-full"
                title={`User Query: ${tokenCounts?.user_query_tokens} tokens`}
              />
              <div
                style={{ width: `${Math.max(10, (tokenCounts?.max_completion_tokens / (tokenCounts?.total_estimated_tokens || 1)) * 100)}%` }}
                className="bg-emerald-500 h-full"
                title={`Max Output Limit: ${tokenCounts?.max_completion_tokens} tokens`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-muted-foreground">System Base:</span>
                <span className="font-mono font-bold text-foreground">{tokenCounts?.system_base_tokens || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground">Schema Context:</span>
                <span className="font-mono font-bold text-foreground">{tokenCounts?.context_schema_tokens || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span className="text-muted-foreground">User Query:</span>
                <span className="font-mono font-bold text-foreground">{tokenCounts?.user_query_tokens || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Output Limit:</span>
                <span className="font-mono font-bold text-foreground">{tokenCounts?.max_completion_tokens || 0}</span>
              </div>
            </div>
          </div>

          {/* Model Cost Comparison Matrix */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-muted-foreground" />
                Multi-Model Financial Cost Matrix
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                Exchange Rate: $1 USD = ₹86 INR
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">LLM Model</th>
                    <th className="py-2.5 px-3">1 Query (USD / INR)</th>
                    <th className="py-2.5 px-3">1,000 Queries</th>
                    <th className="py-2.5 px-3">10,000 Queries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {data?.costs_by_model &&
                    Object.entries(data.costs_by_model).map(([mKey, cData]) => {
                      const isSelected = mKey === model;
                      return (
                        <tr
                          key={mKey}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-zinc-900/5 dark:bg-zinc-100/10 font-bold'
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="py-3 px-3 font-sans font-medium text-foreground flex items-center gap-1.5">
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {cData.model_name}
                          </td>
                          <td className="py-3 px-3 text-foreground">
                            ${cData.single_query_usd} <span className="text-muted-foreground font-normal">(₹{cData.single_query_inr})</span>
                          </td>
                          <td className="py-3 px-3 text-foreground">
                            ${cData.queries_1k_usd} <span className="text-muted-foreground font-normal">(₹{cData.queries_1k_inr})</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                            ${cData.queries_10k_usd} <span className="text-muted-foreground font-normal">(₹{cData.queries_10k_inr})</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
