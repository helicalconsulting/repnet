/**
 * QuickVisuals — renders the Chart / Table tab panel below an executable message.
 *
 * Handles:
 *  - Decimal-string Y-axis values from MySQL drivers (via useChartKeys)
 *  - Correct light/dark colour tokens (via useTheme)
 *  - Tab switching between Bar chart and table preview
 */
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { useChartKeys } from '@/hooks/useChartKeys';

export function QuickVisuals({ msg, initialTab }) {
  const { isDark } = useTheme();
  const hasRows = Array.isArray(msg.rows) && msg.rows.length > 0;
  const [activeTab, setActiveTab] = useState(initialTab ?? (hasRows ? 'chart' : 'table'));

  if (!hasRows && !(msg.columns && msg.columns.length > 0)) return null;

  const cardBg = isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200';
  const dividerBorder = isDark ? 'border-white/5' : 'border-slate-200';
  const tabsBg = isDark ? 'bg-white/5' : 'bg-slate-200/60';
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const tooltipBg = isDark ? '#1E293B' : '#ffffff';
  const tooltipBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const tooltipColor = isDark ? '#ffffff' : '#000000';
  const tableBorder = isDark ? 'border-white/5' : 'border-slate-200';
  const tableHeadBg = isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200';
  const tableRowBorder = isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50';
  const tableCellColor = isDark ? 'text-slate-300' : 'text-slate-700';

  const { xAxisKey, yAxisKey, chartData } = useChartKeys(msg.rows ?? []);
  const cols = msg.columns || Object.keys((msg.rows ?? [])[0] || {});
  const displayCols = cols.filter((k) => k !== 'id' && k !== '__rowId');

  return (
    <div className={`mt-4 w-full rounded-2xl p-4 overflow-hidden border ${cardBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 border-b pb-2 ${dividerBorder}`}>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Visuals
        </span>
        <div className={`flex gap-1 p-1 rounded-lg ${tabsBg}`}>
          {hasRows && (
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                activeTab === 'chart'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chart
            </button>
          )}
          <button
            onClick={() => setActiveTab('table')}
            className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
              activeTab === 'table'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Chart tab */}
      {activeTab === 'chart' && hasRows && (
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey={xAxisKey} stroke={axisStroke} fontSize={10} tickLine={false} />
              <YAxis stroke={axisStroke} fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: tooltipBorder,
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: tooltipColor,
                }}
                labelStyle={{ color: tooltipColor }}
              />
              <Bar dataKey={yAxisKey} fill="url(#primaryGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table tab */}
      {activeTab === 'table' && (
        <div className={`overflow-x-auto w-full border rounded-xl mt-2 max-h-48 overflow-y-auto ${tableBorder}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-muted-foreground font-medium ${tableHeadBg}`}>
                {displayCols.map((col) => (
                  <th key={col} className="px-3 py-2 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasRows ? (
                (msg.rows ?? []).slice(0, 5).map((row, idx) => (
                  <tr key={idx} className={`border-b transition-colors ${tableRowBorder}`}>
                    {(msg.columns || Object.keys(row))
                      .filter((k) => k !== 'id' && k !== '__rowId')
                      .map((col, ci) => (
                        <td key={ci} className={`px-3 py-2 font-mono ${tableCellColor}`}>
                          {typeof row[col] === 'number'
                            ? row[col].toLocaleString()
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={displayCols.length || 1}
                    className={`px-3 py-4 text-center text-muted-foreground font-medium ${
                      isDark ? 'bg-white/5' : 'bg-slate-50'
                    }`}
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
