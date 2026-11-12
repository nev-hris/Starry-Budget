/* =========================================================
   PAGE: INCOME HISTORY
   One entry per year: an hourly wage, a yearly salary, or both.
   ========================================================= */

import { ColumnChart, type ChartItem } from "../components/charts";
import { useForms } from "../forms/useForms";
import { useMoney } from "../hooks/useMoney";
import { asset } from "../lib/assets";
import { useOpenBudget } from "../state/BudgetContext";
import type { IncomeEntry } from "../types";

export default function IncomePage() {
  const { budget } = useOpenBudget();
  const { openIncomeEntry, openUser } = useForms();
  const { money } = useMoney();

  const entries = [...budget.incomeHistory].sort((a, b) => a.year - b.year);
  const birthYear = budget.settings.birthYear;

  const wageItems: ChartItem[] = entries
    .filter((entry) => (entry.hourlyWage ?? 0) > 0)
    .map((entry) => ({
      label: String(entry.year),
      value: entry.hourlyWage!,
      valueLabel: money(entry.hourlyWage!),
    }));

  return (
    <section className="page" id="page-income">
      <div className="page-header">
        <div className="title-with-icon">
          <h1 className="title-pill large">Income History</h1>
          <img
            className="page-illustration on-left is-large"
            src={asset("illustration-5incomehistory.png")}
            alt=""
          />
        </div>
        <button type="button" className="btn" onClick={() => openIncomeEntry()}>
          Add Entry +
        </button>
      </div>

      <div className="card income-overview">
        <p className="eyebrow">How Income History Works</p>
        <h2 className="card-title big">Income History Overview</h2>
        <p>
          Track your yearly income with one entry per year using hourly wage or salary.{" "}
          <span
            className="info"
            tabIndex={0}
            data-tip="Add one entry per year. Fill in an hourly wage, a yearly salary, or both. Click a row to edit it."
          >
            i
          </span>
        </p>
        <p className="note left">
          To make edits to age, go to{" "}
          <button type="button" className="link-button" onClick={openUser}>
            Your User
          </button>
        </p>
      </div>

      <div className="income-charts">
        <div className="card chart-card">
          <h3 className="card-title">Salary by Year</h3>
          <div className="chart-area">
            <SalaryChart entries={entries} />
          </div>
        </div>
        <div className="card chart-card">
          <h3 className="card-title">Hourly Wage by Year</h3>
          <div className="chart-area">
            <ColumnChart items={wageItems} emptyMessage="Add hourly wages to see bar chart." />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Yearly Entries</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Age</th>
                <th>Hourly Wage</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {entries.length ? (
                // Table shows newest year first
                [...entries].reverse().map((entry) => (
                  <tr
                    key={entry.id}
                    className="clickable-row"
                    tabIndex={0}
                    onClick={() => openIncomeEntry(entry)}
                    onKeyDown={(event) => event.key === "Enter" && openIncomeEntry(entry)}
                  >
                    <td>{entry.year}</td>
                    <td>{birthYear ? entry.year - birthYear : "—"}</td>
                    <td>{entry.hourlyWage ? money(entry.hourlyWage) : "—"}</td>
                    <td>{entry.salary ? money(entry.salary) : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <strong>No income history entries yet.</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Salary line chart (SVG) */
function SalaryChart({ entries }: { entries: IncomeEntry[] }) {
  const { compactMoney } = useMoney();

  const points = entries.filter((entry) => (entry.salary ?? 0) > 0);
  if (!points.length) return <p className="empty-note">Add data to see salary trend.</p>;

  const width = 420;
  const height = 210;
  const paddingX = 40;
  const paddingY = 30;
  const maxSalary = Math.max(...points.map((point) => point.salary!));
  const x = (index: number) =>
    points.length === 1 ? width / 2 : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  const y = (value: number) => height - paddingY - (value / maxSalary) * (height - paddingY * 2);

  const line = points.map((point, index) => `${x(index)},${y(point.salary!)}`).join(" ");

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Salary by year">
      <line
        className="chart-grid"
        x1={paddingX / 2}
        y1={height - paddingY}
        x2={width - paddingX / 2}
        y2={height - paddingY}
      />
      <polyline className="line-actual" points={line} />
      {points.map((point, index) => (
        <g key={point.id}>
          <circle className="chart-dot" cx={x(index)} cy={y(point.salary!)} r="5" />
          <text className="chart-text" x={x(index)} y={y(point.salary!) - 10} textAnchor="middle">
            {compactMoney(point.salary!)}
          </text>
          <text className="chart-text" x={x(index)} y={height - 6} textAnchor="middle">
            {point.year}
          </text>
        </g>
      ))}
    </svg>
  );
}
