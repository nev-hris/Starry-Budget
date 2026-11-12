/* One transaction as a small card (Home + the "Cards" view). Click it to edit. */

import { useForms } from "../forms/useForms";
import { formatDate, isFuture } from "../lib/dates";
import { useMoney } from "../hooks/useMoney";
import { useOpenBudget } from "../state/BudgetContext";
import type { Transaction } from "../types";

export default function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { getCategory } = useOpenBudget();
  const { openTransaction } = useForms();
  const { money } = useMoney();

  const category = getCategory(transaction.category);
  const future = isFuture(transaction.date);
  const amountClass = transaction.amount >= 0 ? "is-positive" : "is-negative";

  return (
    <li>
      <button
        type="button"
        className={`transaction-item ${future ? "is-future" : ""}`}
        onClick={() => openTransaction(transaction)}
      >
        <span className="transaction-icon" aria-hidden="true">
          {category?.icon ?? "💸"}
        </span>
        <span className="transaction-main">
          <span className="transaction-title">{transaction.description}</span>
          <span className="transaction-meta">
            {formatDate(transaction.date)} · {transaction.category}
            {future && <span className="badge">Upcoming</span>}
          </span>
        </span>
        <span className={`amount ${amountClass}`}>{money(transaction.amount, { showPlus: true })}</span>
      </button>
    </li>
  );
}
