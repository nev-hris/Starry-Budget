/* =========================================================
   TOP NAVIGATION
   Each link's href (#home, #transactions...) picks the page.
   Words inside .hide-on-phone are hidden on small screens
   so the whole nav bar always fits.
   ========================================================= */

import { useForms } from "../forms/useForms";
import { asset } from "../lib/assets";
import { useOpenBudget } from "../state/BudgetContext";
import type { CurrencyCode, PageName } from "../types";

export default function TopBar({ page }: { page: PageName }) {
  const { budget, profile, updateBudget } = useOpenBudget();
  const { openUser } = useForms();

  // className for a nav link: "active" on the page you're on
  const linkClass = (name: PageName) => `nav-link${page === name ? " active" : ""}`;

  return (
    <header className="topbar" id="topbar">
      <nav className="nav" aria-label="Main">
        <a className={linkClass("home")} href="#home">
          <img className="nav-icon" src={asset("icon-1home.png")} alt="" />
          <span className="nav-label">Home</span>
        </a>
        <a className={linkClass("transactions")} href="#transactions">
          <img className="nav-icon" src={asset("icon-2alltransactions.png")} alt="" />
          <span className="nav-label">
            <span className="hide-on-phone">All </span>Transactions
          </span>
        </a>
        <a className={linkClass("monthly")} href="#monthly">
          <img className="nav-icon" src={asset("icon-3montlyoverview.png")} alt="" />
          <span className="nav-label">
            Monthly<span className="hide-on-phone"> Overview</span>
          </span>
        </a>
        <a className={linkClass("yearly")} href="#yearly">
          <img className="nav-icon" src={asset("icon-4yearlyoverview.png")} alt="" />
          <span className="nav-label">
            Yearly<span className="hide-on-phone"> Overview</span>
          </span>
        </a>
        <a className={linkClass("income")} href="#income">
          <img className="nav-icon" src={asset("icon-5incomehistory.png")} alt="" />
          <span className="nav-label">
            Income<span className="hide-on-phone"> History</span>
          </span>
        </a>
      </nav>

      <div className="topbar-right">
        {/* Only shown while looking at the example budget */}
        <span className="mode-badge" hidden={profile !== "example"}>
          Example
        </span>
        <label className="visually-hidden" htmlFor="currencySelect">
          Currency
        </label>
        <select
          id="currencySelect"
          className="currency-select"
          value={budget.settings.currency}
          onChange={(event) =>
            updateBudget((draft) => {
              draft.settings.currency = event.target.value as CurrencyCode;
            })
          }
        >
          <option value="RSD">RSD</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
        <button type="button" className="user-button" title="Your User" onClick={openUser}>
          {/* A new user without a name is greeted with "Hi there!" */}
          <span>Hi {budget.settings.userName || "there"}!</span>
          <img className="avatar" src={asset("icon-login.png")} alt="" />
        </button>
      </div>
    </header>
  );
}
