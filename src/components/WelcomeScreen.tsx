/* =========================================================
   WELCOME PAGE
   Shown when no budget is open. The two buttons open the
   example budget or the user's own budget.
   ========================================================= */

import { STORAGE_KEYS } from "../config/defaults";
import { asset } from "../lib/assets";
import { loadBudget, readStorage } from "../lib/storage";
import { useBudget } from "../state/BudgetContext";

export default function WelcomeScreen() {
  const { enterProfile } = useBudget();

  // If the new user already saved a budget, offer to continue it
  const savedUser = readStorage(STORAGE_KEYS.user) ? loadBudget("user") : null;
  const savedName = savedUser?.settings.userName;

  let newUserTitle = "Start as a new user";
  let newUserText = "A completely empty budget, ready for your own accounts and transactions.";
  if (savedUser) {
    newUserTitle = savedName ? `Continue as ${savedName}` : "Continue your budget";
    newUserText = "Pick up right where you left off.";
  }

  return (
    <section className="welcome" id="welcomeScreen">
      <div className="welcome-card">
        <img className="welcome-illustration" src={asset("illustration-1home.png")} alt="" />
        <p className="eyebrow">Your dreamy money tracker</p>
        <h1 className="welcome-title">Welcome to Starry Budget</h1>
        <p className="welcome-text">
          Track your spending, plan your months and watch your savings grow.
        </p>

        <div className="welcome-options">
          {/* Main option: the example */}
          <button
            type="button"
            className="welcome-option is-primary"
            onClick={() => enterProfile("example")}
          >
            <span className="welcome-badge">Recommended</span>
            <span className="welcome-frame">
              <img src={asset("dashboardimage.gif")} alt="" />
            </span>
            <span className="welcome-option-title">Explore the example</span>
            <span className="welcome-option-text">
              See every page filled with three months of sample data. It starts fresh each time
              you open it.
            </span>
            <span className="welcome-option-cta">Show me around →</span>
          </button>

          {/* Second option: a real, empty budget (text changes once it has been used) */}
          <button type="button" className="welcome-option" onClick={() => enterProfile("user")}>
            <span className="welcome-option-title">{newUserTitle}</span>
            <span className="welcome-option-text">{newUserText}</span>
            <span className="welcome-option-cta">Let's begin →</span>
          </button>
        </div>
      </div>
    </section>
  );
}
