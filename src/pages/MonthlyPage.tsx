/* =========================================================
   PAGE: MONTHLY OVERVIEW
   "Actual" only counts transactions up to today.
   ========================================================= */

import { Fragment } from "react";
import { CHART_COLORS, GROUPS, MONTH_NAMES } from "../config/defaults";
import { useForms } from "../forms/useForms";
import { useMoney } from "../hooks/useMoney";
import { asset } from "../lib/assets";
import { daysInMonth, isFuture, monthKey, sumBy, today, todayISO } from "../lib/dates";
import { expectedAmount, isSpendingCategory, totalsByCategory } from "../lib/money";
import { useOpenBudget } from "../state/BudgetContext";
import type { Category, Transaction } from "../types";

type Totals = Record<string, number>;

interface Props {
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  moneyMode: "exclude" | "include";
  setMoneyMode: (mode: "exclude" | "include") => void;
}

export default function MonthlyPage({ selectedMonth, setSelectedMonth, moneyMode, setMoneyMode }: Props) {
  const { budget } = useOpenBudget();
  const { openCustomize } = useForms();

  const [year, monthNumber] = selectedMonth.split("-").map(Number);
  const monthIndex = monthNumber - 1;

  const monthTransactions = budget.transactions.filter(
    (transaction) => monthKey(transaction.date) === selectedMonth && !isFuture(transaction.date),
  );
  const actualByCategory = totalsByCategory(monthTransactions);

  return (
    <section className="page" id="page-monthly">
      <div className="page-header">
        <div className="title-with-icon">
          <h1 className="title-pill large">
            {MONTH_NAMES[monthIndex]} {year}
          </h1>
          <img className="page-illustration" src={asset("illustration-3monthlyoverview.png")} alt="" />
        </div>
        <div className="header-controls">
          <input
            type="month"
            className="input"
            aria-label="Choose month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value || monthKey(todayISO))}
          />
          <button type="button" className="btn" onClick={openCustomize}>
            Customize
          </button>
        </div>
      </div>

      <div className="monthly-grid">
        {/* Column 1 */}
        <div className="monthly-column">
          <h2 className="column-title">Category Breakdown</h2>
          <div className="card">
            <p className="hint">Click an expected amount to change that budget.</p>
            <div>
              <CategoryBreakdown actualByCategory={actualByCategory} />
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="monthly-column">
          <h2 className="column-title">Overview</h2>

          <div className="card">
            <h3 className="card-title caps">Money In / Money Out</h3>
            <select
              className="input full-width"
              aria-label="Savings mode"
              value={moneyMode}
              onChange={(event) => setMoneyMode(event.target.value as Props["moneyMode"])}
            >
              <option value="exclude">Excluding Savings</option>
              <option value="include">Including Savings</option>
            </select>
            <p className="note">Actual is month-to-date; expected is full month.</p>
            <div className="inner-card">
              <MoneyInOut actualByCategory={actualByCategory} includeSavings={moneyMode === "include"} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title caps">Weekly Spending</h3>
            <p className="note">Savings excluded</p>
            <WeeklySpending
              monthTransactions={monthTransactions}
              year={year}
              monthIndex={monthIndex}
              selectedMonth={selectedMonth}
            />
          </div>
        </div>

        {/* Column 3 */}
        <div className="monthly-column">
          <h2 className="column-title">Monthly Insights</h2>

          <div className="card">
            <h3 className="card-title caps center">Top 8 Categories</h3>
            <div>
              <TopCategories actualByCategory={actualByCategory} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title caps">Category Groups</h3>
            <p className="note">Actual is month-to-date; expected is full month.</p>
            <div>
              <CategoryGroups actualByCategory={actualByCategory} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title caps">Cumulative Spend vs Budget</h3>
            <p className="note">Savings excluded</p>
            <div className="line-legend">
              <span>
                <span className="legend-swatch actual"></span>Actual
              </span>
              <span>
                <span className="legend-swatch budget"></span>Budget pace
              </span>
            </div>
            <div className="inner-card">
              <CumulativeChart
                monthTransactions={monthTransactions}
                year={year}
                monthIndex={monthIndex}
                selectedMonth={selectedMonth}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Category Breakdown ---------- */

function CategoryBreakdown({ actualByCategory }: { actualByCategory: Totals }) {
  const { budget } = useOpenBudget();
  const actualOf = (category: Category) => actualByCategory[category.name] || 0;

  return (
    <>
      <div className="breakdown-row breakdown-head">
        <span></span>
        <span>Expected</span>
        <span>Current</span>
        <span></span>
      </div>

      {GROUPS.map((group) => {
        const categories = budget.categories.filter((category) => category.group === group);
        const groupExpected = sumBy(categories, expectedAmount);
        const groupActual = sumBy(categories, actualOf);

        return (
          <Fragment key={group}>
            <div className="group-pill-row">
              <span className="group-pill" data-group={group}>
                {group}
              </span>
            </div>

            {group !== "Income" && (
              <BreakdownRow label="Total" expected={groupExpected} actual={groupActual} isTotal />
            )}

            {categories.map((category) => (
              <BreakdownRow
                key={category.name}
                label={category.name}
                icon={category.icon}
                expected={expectedAmount(category)}
                actual={actualOf(category)}
                categoryName={category.name}
              />
            ))}

            {/* Income ends with a calculated "Net Income" line (gross − taxes + bonus) */}
            {group === "Income" && (
              <BreakdownRow
                label="Net Income"
                icon="💖"
                expected={groupExpected}
                actual={groupActual}
                isTotal
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

function BreakdownRow({
  label,
  icon = "",
  expected,
  actual,
  categoryName = null,
  isTotal = false,
}: {
  label: string;
  icon?: string;
  expected: number;
  actual: number;
  categoryName?: string | null;
  isTotal?: boolean;
}) {
  const { openBudget } = useForms();
  const { money } = useMoney();

  const ratio = expected !== 0 ? actual / expected : 0;
  const percent = expected !== 0 ? `${Math.round(ratio * 100)}%` : "";
  const isOverBudget = expected < 0 && ratio > 1;

  return (
    <div className={`breakdown-row ${isTotal ? "is-total" : ""}`}>
      <span className="breakdown-name">
        {icon && (
          <span className="row-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {label}
      </span>
      {/* Only real categories get a clickable (editable) expected amount */}
      {categoryName ? (
        <button type="button" className="budget-button" onClick={() => openBudget(categoryName)}>
          {money(expected)}
        </button>
      ) : (
        <span>{money(expected)}</span>
      )}
      <span>{money(actual)}</span>
      <span className={`breakdown-percent ${isOverBudget ? "is-over" : ""}`}>{percent}</span>
    </div>
  );
}

/* ---------- Money In / Money Out ---------- */

function MoneyInOut({ actualByCategory, includeSavings }: { actualByCategory: Totals; includeSavings: boolean }) {
  const { budget } = useOpenBudget();
  const { money } = useMoney();

  const incomeCategories = budget.categories.filter((category) => category.group === "Income");
  const outCategories = budget.categories.filter(
    (category) => category.group !== "Income" && (includeSavings || category.kind !== "savings"),
  );

  // Money in = net income (taxes already subtracted)
  const expectedIn = sumBy(incomeCategories, expectedAmount);
  const expectedOut = sumBy(outCategories, (category) => category.budget);
  const actualIn = sumBy(incomeCategories, (category) => actualByCategory[category.name] || 0);
  const actualOut = -sumBy(outCategories, (category) => actualByCategory[category.name] || 0);

  const tallest = Math.max(expectedIn, expectedOut, actualIn, actualOut, 1);
  const ratio = (moneyIn: number, moneyOut: number) =>
    moneyIn > 0 ? `${((moneyOut / moneyIn) * 100).toFixed(1)}%` : "N/A";

  const bar = (value: number, type: "in" | "out") => (
    <div className="io-bar">
      <span className="io-value">{money(value)}</span>
      <div className="io-track">
        <div className={`io-fill ${type}`} style={{ height: `${(Math.max(value, 0) / tallest) * 100}%` }}></div>
      </div>
      <span className="io-label">{type === "in" ? "Money In" : "Money Out"}</span>
    </div>
  );

  return (
    <div className="io-chart">
      <div className="io-group">
        <h4>Expected</h4>
        <div className="io-bars">
          {bar(expectedIn, "in")}
          {bar(expectedOut, "out")}
        </div>
        <p className="io-ratio">Out / In: {ratio(expectedIn, expectedOut)}</p>
      </div>
      <div className="io-group">
        <h4>Actual</h4>
        <div className="io-bars">
          {bar(actualIn, "in")}
          {bar(actualOut, "out")}
        </div>
        <p className="io-ratio">Out / In: {ratio(actualIn, actualOut)}</p>
      </div>
    </div>
  );
}

/* ---------- Weekly Spending ---------- */

interface MonthChartProps {
  monthTransactions: Transaction[];
  year: number;
  monthIndex: number;
  selectedMonth: string;
}

function WeeklySpending({ monthTransactions, year, monthIndex, selectedMonth }: MonthChartProps) {
  const { getCategory } = useOpenBudget();
  const { money } = useMoney();

  const lastDay = daysInMonth(year, monthIndex);
  // Simple weeks: 1–7, 8–14, 15–21, 22–28, 29–end
  const weeks = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, 28],
  ];
  if (lastDay > 28) weeks.push([29, lastDay]);

  const spending = monthTransactions.filter((transaction) =>
    isSpendingCategory(getCategory(transaction.category)),
  );
  const weekTotals = weeks.map(
    ([start, end]) =>
      -sumBy(
        spending.filter((transaction) => {
          const day = Number(transaction.date.slice(8, 10));
          return day >= start && day <= end;
        }),
        (transaction) => transaction.amount,
      ),
  );

  const largest = Math.max(...weekTotals, 1);
  const monthShort = MONTH_NAMES[monthIndex].slice(0, 3);

  // Average only counts weeks that have already started
  const currentMonth = monthKey(todayISO);
  let startedWeeks = 0;
  if (selectedMonth < currentMonth) startedWeeks = weeks.length;
  else if (selectedMonth === currentMonth)
    startedWeeks = weeks.filter(([start]) => start <= today.getDate()).length;

  const monthTotal = sumBy(weekTotals, (total) => total);
  const weeklyAverage = startedWeeks ? monthTotal / startedWeeks : 0;

  return (
    <>
      <div className="inner-card">
        {weeks.map(([start, end], index) => (
          <div className="week-row" key={start}>
            <span className="week-label">
              {monthShort} {start}-{end}
            </span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(weekTotals[index] / largest) * 100}%` }}></div>
            </div>
            <span>{money(weekTotals[index])}</span>
          </div>
        ))}
      </div>
      <p className="card-footer-text">
        Month to date: {money(monthTotal)} · Avg/week: {money(weeklyAverage)}
      </p>
    </>
  );
}

/* ---------- Top 8 Categories (donut) ---------- */

function TopCategories({ actualByCategory }: { actualByCategory: Totals }) {
  const { budget } = useOpenBudget();
  const { money } = useMoney();

  const items = budget.categories
    .filter(isSpendingCategory)
    .map((category) => ({
      label: category.name,
      icon: category.icon,
      value: -(actualByCategory[category.name] || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (!items.length) {
    return (
      <>
        <div className="donut donut-empty">
          <div className="donut-hole">
            <span className="donut-tag">Top 8</span>
            <strong>No activity yet</strong>
            <small>Your busiest categories will land here.</small>
          </div>
        </div>
        <p className="empty-note">Your top categories list will populate after spending is categorized.</p>
      </>
    );
  }

  // Build the donut with a conic-gradient: each slice gets its share of 360°
  const total = sumBy(items, (item) => item.value);
  let angle = 0;
  const slices = items.map((item, index) => {
    const start = angle;
    angle += (item.value / total) * 360;
    return `${CHART_COLORS[index]} ${start}deg ${angle}deg`;
  });

  return (
    <>
      <div className="donut" style={{ background: `conic-gradient(${slices.join(", ")})` }}>
        <div className="donut-hole">
          <span className="donut-tag">Top 8</span>
          <strong>{money(total)}</strong>
          <small>spent</small>
        </div>
      </div>
      <ul className="legend-list">
        {items.map((item, index) => (
          <li key={item.label}>
            <span className="legend-dot" style={{ background: CHART_COLORS[index] }}></span>
            <span className="legend-name">
              {item.icon} {item.label}
            </span>
            <span>{money(item.value)}</span>
            <span className="legend-percent">{Math.round((item.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Category Groups ---------- */

function CategoryGroups({ actualByCategory }: { actualByCategory: Totals }) {
  const { budget } = useOpenBudget();
  const { money } = useMoney();

  return GROUPS.filter((group) => group !== "Income").map((group) => {
    const categories = budget.categories.filter((category) => category.group === group);
    const expected = sumBy(categories, (category) => category.budget);
    const spent = -sumBy(categories, (category) => actualByCategory[category.name] || 0);
    const percent = expected ? (spent / expected) * 100 : 0;

    return (
      <div className="group-progress" key={group}>
        <div className="group-progress-top">
          <span>{group}</span>
          <span>
            {money(spent)} / {money(expected)}
          </span>
        </div>
        <div className="bar-track">
          <div
            className={`bar-fill ${percent > 100 ? "is-over" : ""}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  });
}

/* ---------- Cumulative Spend vs Budget (SVG line chart) ---------- */

function CumulativeChart({ monthTransactions, year, monthIndex, selectedMonth }: MonthChartProps) {
  const { budget, getCategory } = useOpenBudget();
  const { money } = useMoney();

  const lastDay = daysInMonth(year, monthIndex);
  const currentMonth = monthKey(todayISO);

  // How many days of "actual" to draw: whole month (past), up to today (current), none (future)
  let daysToShow = 0;
  if (selectedMonth < currentMonth) daysToShow = lastDay;
  else if (selectedMonth === currentMonth) daysToShow = today.getDate();

  const budgetTotal = sumBy(budget.categories.filter(isSpendingCategory), (category) => category.budget);

  // Spending per day, then a running total
  const dailySpend = new Array(lastDay + 1).fill(0);
  monthTransactions.forEach((transaction) => {
    if (isSpendingCategory(getCategory(transaction.category))) {
      dailySpend[Number(transaction.date.slice(8, 10))] -= transaction.amount;
    }
  });
  const cumulative: number[] = [];
  let runningTotal = 0;
  for (let day = 1; day <= daysToShow; day += 1) {
    runningTotal += dailySpend[day];
    cumulative.push(runningTotal);
  }

  // Map days/amounts to SVG coordinates
  const width = 320;
  const height = 160;
  const padding = 10;
  const maxValue = Math.max(budgetTotal, runningTotal, 1);
  const x = (day: number) => padding + ((day - 1) / (lastDay - 1)) * (width - padding * 2);
  const y = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);

  const budgetLine = `${x(1)},${y(budgetTotal / lastDay)} ${x(lastDay)},${y(budgetTotal)}`;
  const actualLine = cumulative.map((value, index) => `${x(index + 1)},${y(value)}`).join(" ");

  return (
    <>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cumulative spending compared with budget pace"
      >
        <line className="chart-grid" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line className="chart-grid" x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} />
        <polyline className="line-budget" points={budgetLine} />
        {actualLine && <polyline className="line-actual" points={actualLine} />}
        {cumulative.length > 0 && (
          <circle className="chart-dot" cx={x(cumulative.length)} cy={y(runningTotal)} r="4" />
        )}
      </svg>
      <p className="chart-caption">
        Spent {money(runningTotal)} of {money(budgetTotal)}
      </p>
    </>
  );
}
