/* =========================================================
   CHART HELPERS (simple bars made with HTML + CSS)
   Styles: 07-charts.css
   ========================================================= */

import { useMoney } from "../hooks/useMoney";

export interface ChartItem {
  label: string;
  value: number; // in RSD
  icon?: string;
  fullLabel?: string;
  valueLabel?: string; // text shown above a column (column chart only)
}

/** Horizontal bars */
export function BarList({ items, emptyMessage = "" }: { items: ChartItem[]; emptyMessage?: string }) {
  const { money } = useMoney();
  if (!items.length) return <p className="empty-note">{emptyMessage}</p>;
  const largest = Math.max(...items.map((item) => item.value));

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.label}>
          <div className="bar-list-top">
            <span>
              {item.icon ? `${item.icon} ` : ""}
              {item.label}
            </span>
            <strong>{money(item.value)}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.value / largest) * 100}%` }}></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical bars */
export function ColumnChart({ items, emptyMessage = "" }: { items: ChartItem[]; emptyMessage?: string }) {
  const { money } = useMoney();
  if (!items.some((item) => item.value > 0)) return <p className="empty-note">{emptyMessage}</p>;
  const largest = Math.max(...items.map((item) => item.value));

  return (
    <div className="column-chart">
      {items.map((item) => (
        <div className="column" key={item.label} title={`${item.label}: ${money(item.value)}`}>
          {item.valueLabel && <span className="column-value">{item.valueLabel}</span>}
          <div className="column-track">
            <div className="column-fill" style={{ height: `${(item.value / largest) * 100}%` }}></div>
          </div>
          <span className="column-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
