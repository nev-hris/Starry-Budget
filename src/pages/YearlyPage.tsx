/* =========================================================
   PAGE: YEARLY OVERVIEW
   ========================================================= */

import { BarList, ColumnChart, type ChartItem } from "../components/charts";
import { GROUPS, MONTH_NAMES } from "../config/defaults";
import { useForms } from "../forms/useForms";
import { useMoney } from "../hooks/useMoney";
import { asset } from "../lib/assets";
import { isFuture, monthKey, sumBy, today } from "../lib/dates";
import { isSpendingCategory, totalsByCategory } from "../lib/money";
import { useOpenBudget } from "../state/BudgetContext";
import type { Category } from "../types";

interface Props {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export default function YearlyPage({ selectedYear, setSelectedYear }: Props) {
  const { budget, getCategory } = useOpenBudget();
  const { openCustomize } = useForms();
  const { money } = useMoney();
  const { categories } = budget;

  // Year dropdown: every year that has transactions, plus this year
  const years = [
    ...new Set([today.getFullYear(), ...budget.transactions.map((t) => Number(t.date.slice(0, 4)))]),
  ].sort((a, b) => b - a);

  const yearTransactions = budget.transactions.filter(
    (transaction) => transaction.date.startsWith(String(selectedYear)) && !isFuture(transaction.date),
  );
  const totals = totalsByCategory(yearTransactions);
  const totalFor = (category: Category) => totals[category.name] || 0;
  const spentFor = (category: Category) => -totalFor(category);

  // Top stat tiles
  const gross = sumBy(categories.filter((c) => c.kind === "income"), totalFor);
  const tax = -sumBy(categories.filter((c) => c.kind === "tax"), totalFor);

  // Spending by group (Housing, Necessities, Wants)
  const groupItems: ChartItem[] = GROUPS.filter((group) => group !== "Income" && group !== "Savings")
    .map((group) => ({
      label: group,
      value: sumBy(categories.filter((c) => c.group === group), spentFor),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Savings mix
  const savingsItems: ChartItem[] = categories
    .filter((category) => category.kind === "savings")
    .map((category) => ({ label: category.name, icon: category.icon, value: spentFor(category) }))
    .filter((item) => item.value > 0);

  // Top spending categories
  const categoryItems: ChartItem[] = categories
    .filter(isSpendingCategory)
    .map((category) => ({ label: category.name, icon: category.icon, value: spentFor(category) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Spending per month
  const monthItems: ChartItem[] = MONTH_NAMES.map((monthName, monthIndex) => {
    const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    const value = -sumBy(
      yearTransactions.filter(
        (t) => monthKey(t.date) === key && isSpendingCategory(getCategory(t.category)),
      ),
      (t) => t.amount,
    );
    return { label: monthName.slice(0, 3), fullLabel: monthName, value };
  });

  // Top 3 months
  const medals = ["🥇", "🥈", "🥉"];
  const rankedMonths = monthItems
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  // Average: this year counts months so far, past years count all 12
  let monthsIncluded = 0;
  if (selectedYear < today.getFullYear()) monthsIncluded = 12;
  else if (selectedYear === today.getFullYear()) monthsIncluded = today.getMonth() + 1;
  const yearTotal = sumBy(monthItems, (item) => item.value);
  const monthlyAverage = monthsIncluded ? yearTotal / monthsIncluded : 0;

  // Wants vs needs (top 3 each)
  const topOfKind = (kind: Category["kind"]): ChartItem[] =>
    categories
      .filter((category) => category.kind === kind)
      .map((category) => ({ label: category.name, icon: category.icon, value: spentFor(category) }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  const wants = topOfKind("want");
  const needs = topOfKind("need");

  return (
    <section className="page" id="page-yearly">
      <div className="page-header">
        <div className="title-with-icon">
          <h1 className="title-pill large">{selectedYear} Yearly Overview</h1>
          <img className="page-illustration" src={asset("illustration-4yearlyoverview.png")} alt="" />
        </div>
        <div className="header-controls">
          <select
            className="input"
            aria-label="Choose year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={openCustomize}>
            Customize
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <p className="stat-label">YTD Net</p>
          <p className="stat-value">{money(gross - tax)}</p>
        </div>
        {/* Framed animated picture */}
        <div className="banner stat-banner">
          <img src={asset("yearlyincomeimage.gif")} alt="" />
        </div>
        <div className="card stat-card">
          <p className="stat-label">YTD Gross</p>
          <p className="stat-value">{money(gross)}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">YTD Tax</p>
          <p className="stat-value">{money(tax)}</p>
        </div>
      </div>

      <div className="yearly-grid">
        <div className="card">
          <h3 className="card-title">YTD Spending by Budget Group</h3>
          <div className="inner-card">
            <BarList items={groupItems} emptyMessage="No YTD category spending to chart yet." />
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Savings Mix (YTD)</h3>
          <div className="inner-card">
            {savingsItems.length ? (
              <>
                <BarList items={savingsItems} />
                <div className="kv-row">
                  <span>Total saved</span>
                  <strong>{money(sumBy(savingsItems, (i) => i.value))}</strong>
                </div>
              </>
            ) : (
              <p className="empty-note">No YTD savings data to chart yet.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Top Budget Categories (YTD Spend)</h3>
          <div className="inner-card">
            <BarList items={categoryItems} emptyMessage="No YTD category spending to chart yet." />
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Monthly Budget Spend (YTD)</h3>
          <div className="inner-card">
            <ColumnChart items={monthItems} emptyMessage="No YTD monthly spending to chart yet." />
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Top Spending Months (YTD So Far)</h3>
          <div className="inner-card">
            <p className="stat-label">Top spending months</p>
            {rankedMonths.length ? (
              <ol className="ranked-list">
                {rankedMonths.map((item, index) => (
                  <li key={item.label}>
                    <span>
                      {medals[index]} {item.fullLabel}
                    </span>
                    <strong>{money(item.value)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="big-number">No spending yet</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Average Monthly Spend (YTD So Far)</h3>
          <div className="inner-card">
            <p className="stat-label">YTD Monthly Average</p>
            <p className="big-number">{money(monthlyAverage)}</p>
            <div className="kv-row">
              <span>YTD Total Spend</span>
              <strong>{money(yearTotal)}</strong>
            </div>
            <div className="kv-row">
              <span>Months Included</span>
              <strong>{monthsIncluded} Months</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Top Wants vs Needs Categories (YTD)</h3>
          <div className="inner-card">
            {wants.length || needs.length ? (
              <div className="wants-needs">
                <div>
                  <h4>✨ Wants</h4>
                  <BarList items={wants} emptyMessage="None yet" />
                </div>
                <div>
                  <h4>🏡 Needs</h4>
                  <BarList items={needs} emptyMessage="None yet" />
                </div>
              </div>
            ) : (
              <p className="empty-note">No wants or needs category spending to chart yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
