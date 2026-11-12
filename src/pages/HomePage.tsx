/* =========================================================
   PAGE: HOME  (Net Worth left, Recent Transactions right)
   Every "Customize" button opens the same small pop-up
   (show/hide the animated illustrations on all pages).
   ========================================================= */

import TransactionItem from "../components/TransactionItem";
import { useForms } from "../forms/useForms";
import { useMoney } from "../hooks/useMoney";
import { asset } from "../lib/assets";
import { isFuture, sumBy } from "../lib/dates";
import { useOpenBudget } from "../state/BudgetContext";
import type { BalanceItem } from "../types";

export default function HomePage() {
  const { budget, updateBudget } = useOpenBudget();
  const forms = useForms();
  const { money } = useMoney();
  const { showAssets } = budget.settings;

  // Net worth = account balances (+ assets when "Assets On")
  const accountsTotal = sumBy(budget.accounts, (account) => account.amount);
  const assetsTotal = sumBy(budget.assets, (asset) => asset.amount);
  const netWorth = accountsTotal + (showAssets ? assetsTotal : 0);

  // Small line under the total that explains what it includes
  let note;
  if (!budget.assets.length) {
    note = "No assets yet. Add one below to include it.";
  } else if (showAssets) {
    note = `Accounts ${money(accountsTotal)} + Assets ${money(assetsTotal)}`;
  } else {
    note = `Accounts only (Assets ${money(assetsTotal)} not included)`;
  }

  const recentTransactions = budget.transactions
    .filter((transaction) => !isFuture(transaction.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  function setShowAssets(value: boolean) {
    updateBudget((draft) => {
      draft.settings.showAssets = value;
    });
  }

  return (
    <section className="page" id="page-home">
      <div className="home-grid">
        {/* Left column */}
        <div className="home-column">
          <div className="section-header">
            <h2 className="title-pill">Net Worth</h2>
            <button type="button" className="btn" onClick={forms.openCustomize}>
              Customize
            </button>
          </div>

          <div className="toggle-row">
            <div className="segmented" role="group" aria-label="Include assets in net worth">
              <button
                type="button"
                className={`segmented-option${!showAssets ? " active" : ""}`}
                onClick={() => setShowAssets(false)}
              >
                Assets Off
              </button>
              <button
                type="button"
                className={`segmented-option${showAssets ? " active" : ""}`}
                onClick={() => setShowAssets(true)}
              >
                Assets On
              </button>
            </div>
            <span
              className="info"
              tabIndex={0}
              data-tip="Assets On adds things you own (car, home...) to your net worth."
            >
              i
            </span>
          </div>

          <p className="net-worth">
            <img className="net-worth-avatar" src={asset("icon-networth.png")} alt="" />
            <span>{money(netWorth)}</span>
          </p>
          <p className="net-worth-note">{note}</p>

          {/* Framed animated picture */}
          <div className="banner">
            <img src={asset("dashboardimage.gif")} alt="" />
          </div>

          <div>
            <div className="section-header">
              <div className="section-header-left">
                <h3 className="title-pill small">Accounts</h3>
                <span
                  className="info"
                  tabIndex={0}
                  data-tip="Click an account to update its balance or delete it."
                >
                  i
                </span>
              </div>
              <button type="button" className="btn" onClick={() => forms.openBalanceItem("accounts")}>
                Add +
              </button>
            </div>
            <p className="list-label">Accounts</p>
            <BalanceList
              items={budget.accounts}
              icon="👛"
              emptyMessage="No accounts added yet."
              onOpen={(item) => forms.openBalanceItem("accounts", item)}
            />
          </div>

          <div>
            <div className="section-header">
              <h3 className="title-pill small">Assets</h3>
              <button type="button" className="btn" onClick={() => forms.openBalanceItem("assets")}>
                Add +
              </button>
            </div>
            <BalanceList
              items={budget.assets}
              icon="💎"
              emptyMessage="No assets added yet."
              onOpen={(item) => forms.openBalanceItem("assets", item)}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="home-column">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="title-pill">Recent Transactions</h2>
              <img
                className="page-illustration small is-large"
                src={asset("illustration-1home.png")}
                alt=""
              />
            </div>
            <button type="button" className="btn" onClick={() => forms.openTransaction()}>
              New +
            </button>
          </div>
          <ul className="transaction-list">
            {recentTransactions.length ? (
              recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <li className="empty-on-bg">No recent transactions yet.</li>
            )}
          </ul>
          <p className="see-all">
            <a href="#transactions" className="link-button">
              See all transactions →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** The list of accounts (or assets). Click one to edit it. */
function BalanceList({
  items,
  icon,
  emptyMessage,
  onOpen,
}: {
  items: BalanceItem[];
  icon: string;
  emptyMessage: string;
  onOpen: (item: BalanceItem) => void;
}) {
  const { money } = useMoney();

  return (
    <ul className="money-list">
      {items.length ? (
        items.map((item) => (
          <li key={item.id}>
            <button type="button" className="money-item" onClick={() => onOpen(item)}>
              <span className="item-icon" aria-hidden="true">
                {icon}
              </span>
              <span className="item-name">{item.name}</span>
              <span>{money(item.amount)}</span>
            </button>
          </li>
        ))
      ) : (
        <li className="empty-on-bg">{emptyMessage}</li>
      )}
    </ul>
  );
}
