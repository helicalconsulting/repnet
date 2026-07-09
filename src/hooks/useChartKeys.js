/**
 * useChartKeys — determine X/Y axis column keys from a dataset.
 *
 * Handles the common MySQL/MSSQL edge case where DECIMAL columns are returned
 * as string objects (e.g. "92.8") by the DB driver. We detect them via
 * Number() parsing rather than typeof === 'number'.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @returns {{ xAxisKey: string, yAxisKey: string, chartData: Array }}
 */
export function useChartKeys(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !rows[0]) {
    return { xAxisKey: '', yAxisKey: '', chartData: [] };
  }

  const keys = Object.keys(rows[0]).filter((k) => k !== 'id' && k !== '__rowId');
  let xAxisKey = '';
  let yAxisKey = '';

  // First non-numeric string → X axis label
  for (const key of keys) {
    const val = rows[0][key];
    if (typeof val === 'string' && isNaN(Number(val)) && !xAxisKey) {
      xAxisKey = key;
    }
  }
  if (!xAxisKey) xAxisKey = keys[0] || '';

  // First parseable numeric value (excluding xAxisKey) → Y axis
  for (const key of keys) {
    if (key === xAxisKey) continue;
    const val = rows[0][key];
    if (val !== null && val !== undefined && !isNaN(Number(val)) && typeof val !== 'boolean') {
      yAxisKey = key;
      break;
    }
  }
  if (!yAxisKey) yAxisKey = keys.find((k) => k !== xAxisKey) || keys[0] || '';

  // Ensure Y values are JS numbers (not decimal strings) so Recharts renders bars
  const chartData = rows.slice(0, 8).map((row) => {
    const raw = row[yAxisKey];
    const num = raw !== null && raw !== undefined ? Number(raw) : 0;
    return { ...row, [yAxisKey]: isNaN(num) ? 0 : num };
  });

  return { xAxisKey, yAxisKey, chartData };
}
