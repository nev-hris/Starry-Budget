/* =========================================================
   APP — the whole page
   ---------------------------------------------------------
   - No budget open → the welcome page
   - A budget open  → top bar + the page from the URL (#home, #monthly...)
   The light/dark button and the sparkle trail are always there.
   ========================================================= */

import { useEffect, useState } from "react";
import Backdrop from "./components/Backdrop";
import SparkleTrail from "./components/SparkleTrail";
import ThemeSwitcher from "./components/ThemeSwitcher";
import TopBar from "./components/TopBar";
import WelcomeScreen from "./components/WelcomeScreen";
import { STORAGE_KEYS } from "./config/defaults";
import { useHashPage } from "./hooks/useHashPage";
import { monthKey, today, todayISO } from "./lib/dates";
import { readStorage, writeStorage } from "./lib/storage";
import HomePage from "./pages/HomePage";
import IncomePage from "./pages/IncomePage";
import MonthlyPage from "./pages/MonthlyPage";
import TransactionsPage, { createDefaultFilters } from "./pages/TransactionsPage";
import YearlyPage from "./pages/YearlyPage";
import { useBudget } from "./state/BudgetContext";
import type { Theme } from "./types";

export default function App() {
  const { budget } = useBudget();
  const page = useHashPage();

  // Light / dark mode (remembered in localStorage)
  const [theme, setTheme] = useState<Theme>(() =>
    readStorage(STORAGE_KEYS.theme) === "dark" ? "dark" : "light",
  );

  // Settings of each page, kept here so they stay the same
  // when you switch to another page and come back
  const [transactionFilters, setTransactionFilters] = useState(createDefaultFilters);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(todayISO));
  const [moneyMode, setMoneyMode] = useState<"exclude" | "include">("exclude");
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Setting data-theme on <html> swaps the colours AND triggers the
  // icon "morph" in the theme button (see .theme-icon in the CSS)
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    writeStorage(STORAGE_KEYS.theme, newTheme);
    setTheme(newTheme);
  }

  // The "hide-illustrations" class on <body> hides every page picture
  const hideIllustrations = budget ? !budget.settings.showIllustrations : false;
  useEffect(() => {
    document.body.classList.toggle("hide-illustrations", hideIllustrations);
  }, [hideIllustrations]);

  // Stop images and icons from being saved with right-click or dragged out
  useEffect(() => {
    function blockOnImages(event: Event) {
      if ((event.target as Element).closest?.("img")) event.preventDefault();
    }
    document.addEventListener("contextmenu", blockOnImages);
    document.addEventListener("dragstart", blockOnImages);
    return () => {
      document.removeEventListener("contextmenu", blockOnImages);
      document.removeEventListener("dragstart", blockOnImages);
    };
  }, []);

  return (
    <>
      <Backdrop />

      {budget ? (
        <>
          <TopBar page={page} />
          <main className="main" id="appMain">
            {page === "home" && <HomePage />}
            {page === "transactions" && (
              <TransactionsPage filters={transactionFilters} setFilters={setTransactionFilters} />
            )}
            {page === "monthly" && (
              <MonthlyPage
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                moneyMode={moneyMode}
                setMoneyMode={setMoneyMode}
              />
            )}
            {page === "yearly" && (
              <YearlyPage selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
            )}
            {page === "income" && <IncomePage />}
          </main>
        </>
      ) : (
        <WelcomeScreen />
      )}

      <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
      <SparkleTrail />
    </>
  );
}
