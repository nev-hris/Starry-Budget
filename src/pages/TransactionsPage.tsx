/* =========================================================
   PAGE: ALL TRANSACTIONS
   The filter settings live in App.tsx, so they are kept when
   you visit another page and come back (like before).
   ========================================================= */

import TransactionItem from "../components/TransactionItem";
import { Options } from "../forms/FormDialog";
import { categoryOptions, useForms } from "../forms/useForms";
import { useMoney } from "../hooks/useMoney";
import { asset } from "../lib/assets";
import { formatDate, isFuture, monthKey, sumBy, toISODate, today, todayISO } from "../lib/dates";
import { useOpenBudget } from "../state/BudgetContext";
import type { Transaction } from "../types";

export interface TransactionFilters {
  search: string;
  range: "this-month" | "last-month" | "this-year" | "all";
  flow: "any" | "in" | "out";
  category: string; // "all" or a category name
  view: "table" | "cards";
  showFuture: boolean;
  filtersOpen: boolean;
}

/** Filters when the app starts (cards are easier to read on small phone screens) */
export function createDefaultFilters(): TransactionFilters {
  return {
    search: "",
    range: "this-month",
    flow: "any",
    category: "all",
    view: window.matchMedia("(max-width: 640px)").matches ? "cards" : "table",
    showFuture: true,
    filtersOpen: true,
  };
}

/** Returns the transactions that match every filter, newest first */
function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const searchText = filters.search.trim().toLowerCase();
  const thisMonth = monthKey(todayISO);
  const lastMonth = monthKey(toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1)));
  const thisYear = String(today.getFullYear());

  return transactions
    .filter((transaction) => {
      if (!filters.showFuture && isFuture(transaction.date)) return false;
      if (filters.range === "this-month" && monthKey(transaction.date) !== thisMonth) return false;
      if (filters.range === "last-month" && monthKey(transaction.date) !== lastMonth) return false;
      if (filters.range === "this-year" && !transaction.date.startsWith(thisYear)) return false;
      if (filters.flow === "in" && transaction.amount < 0) return false;
      if (filters.flow === "out" && transaction.amount > 0) return false;
      if (filters.category !== "all" && transaction.category !== filters.category) return false;
      if (searchText) {
        const haystack = `${transaction.description} ${transaction.category}`.toLowerCase();
        if (!haystack.includes(searchText)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

interface Props {
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
}

export default function TransactionsPage({ filters, setFilters }: Props) {
  const { budget } = useOpenBudget();
  const { openTransaction } = useForms();
  const { money } = useMoney();

  // Changes one filter and keeps the others
  const change = (newValues: Partial<TransactionFilters>) => setFilters({ ...filters, ...newValues });

  function resetFilters() {
    change({ search: "", range: "this-month", flow: "any", category: "all", showFuture: true });
  }

  const transactions = filterTransactions(budget.transactions, filters);
  const moneyIn = sumBy(transactions.filter((t) => t.amount > 0), (t) => t.amount);
  const moneyOut = sumBy(transactions.filter((t) => t.amount < 0), (t) => t.amount);

  return (
    <section className="page" id="page-transactions">
      <div className="page-header">
        <div className="title-with-icon">
          <h1 className="title-pill large">All Transactions</h1>
          <img
            className="page-illustration on-left"
            src={asset("illustration-2alltransactions.png")}
            alt=""
          />
        </div>
      </div>

      <div className="card filters-card">
        <div className="filters-top">
          <h2 className="card-title">Filters</h2>
          <button
            type="button"
            className="text-button"
            aria-expanded={filters.filtersOpen}
            onClick={() => change({ filtersOpen: !filters.filtersOpen })}
          >
            {filters.filtersOpen ? "HIDE ▴" : "SHOW ▾"}
          </button>
        </div>

        <div className="filters-body" hidden={!filters.filtersOpen}>
          <div className="filter-row">
            <input
              type="search"
              className="input filter-search"
              placeholder="Search transactions..."
              aria-label="Search transactions"
              value={filters.search}
              onChange={(event) => change({ search: event.target.value })}
            />
            <select
              className="input"
              aria-label="Date range"
              value={filters.range}
              onChange={(event) => change({ range: event.target.value as TransactionFilters["range"] })}
            >
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="this-year">This year</option>
              <option value="all">All time</option>
            </select>
            <div className="segmented filter-future" role="group" aria-label="Future transactions">
              <button
                type="button"
                className={`segmented-option${filters.showFuture ? " active" : ""}`}
                onClick={() => change({ showFuture: true })}
              >
                Show Future
              </button>
              <button
                type="button"
                className={`segmented-option${!filters.showFuture ? " active" : ""}`}
                onClick={() => change({ showFuture: false })}
              >
                Hide Future
              </button>
            </div>
          </div>
          <div className="filter-row">
            <select
              className="input"
              aria-label="Amount type"
              value={filters.flow}
              onChange={(event) => change({ flow: event.target.value as TransactionFilters["flow"] })}
            >
              <option value="any">Any amount</option>
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </select>
            <select
              className="input filter-category"
              aria-label="Category"
              value={filters.category}
              onChange={(event) => change({ category: event.target.value })}
            >
              <option value="all">All categories</option>
              <Options options={categoryOptions(budget)} />
            </select>
            <button type="button" className="text-button danger" onClick={resetFilters}>
              Reset
            </button>
            <select
              className="input"
              aria-label="View"
              value={filters.view}
              onChange={(event) => change({ view: event.target.value as TransactionFilters["view"] })}
            >
              <option value="table">Table</option>
              <option value="cards">Cards</option>
            </select>
            <button type="button" className="btn btn-white" onClick={() => openTransaction()}>
              New +
            </button>
          </div>
        </div>
      </div>

      <div className="results-area">
        <p className="results-summary">
          {transactions.length > 0 &&
            `${transactions.length} transactions · In ${money(moneyIn)} · Out ${money(Math.abs(moneyOut))}`}
        </p>
        <div>
          {!transactions.length ? (
            <div className="card empty-card">No transactions found.</div>
          ) : filters.view === "cards" ? (
            <ul className="transaction-list cards-grid">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </ul>
          ) : (
            <TransactionsTable transactions={transactions} />
          )}
        </div>
      </div>
    </section>
  );
}

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const { getCategory } = useOpenBudget();
  const { openTransaction } = useForms();
  const { money } = useMoney();

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="align-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const category = getCategory(transaction.category);
              const future = isFuture(transaction.date);
              const amountClass = transaction.amount >= 0 ? "is-positive" : "is-negative";

              return (
                <tr
                  key={transaction.id}
                  className={`clickable-row ${future ? "is-future" : ""}`}
                  tabIndex={0}
                  onClick={() => openTransaction(transaction)}
                  // Rows are focusable – Enter opens them like a click
                  onKeyDown={(event) => event.key === "Enter" && openTransaction(transaction)}
                >
                  <td>
                    {formatDate(transaction.date)}
                    {future && <span className="badge">Upcoming</span>}
                  </td>
                  <td>{transaction.description}</td>
                  <td>
                    <span className="category-chip">
                      {category?.icon ?? ""} {transaction.category}
                    </span>
                  </td>
                  <td className={`align-right amount ${amountClass}`}>
                    {money(transaction.amount, { showPlus: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
