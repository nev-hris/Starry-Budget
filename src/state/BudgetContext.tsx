/* =========================================================
   BUDGET STATE
   ---------------------------------------------------------
   Holds the budget that is open right now and saves it to
   localStorage every time it changes.

   Any component can use it:
     const { budget, updateBudget } = useBudget();

   updateBudget lets you change the budget as if it were a normal
   object. Behind the scenes it works on a copy, so React notices
   the change and redraws the page:
     updateBudget((draft) => { draft.settings.currency = "EUR"; });
   ========================================================= */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "../config/defaults";
import { createFreshBudget } from "../lib/budget";
import { loadBudget, readStorage, saveBudget, writeStorage } from "../lib/storage";
import type { Budget, Category, Profile } from "../types";

interface BudgetContextValue {
  /** 'example', 'user', or null when the welcome page is showing */
  profile: Profile | null;
  /** The open budget (null on the welcome page) */
  budget: Budget | null;
  updateBudget: (change: (draft: Budget) => void) => void;
  setBudget: (budget: Budget) => void;
  enterProfile: (profile: Profile) => void;
  showWelcome: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

/** Which budget was open last time (so a refresh reopens it) */
function readLastProfile(): Profile | null {
  const last = readStorage(STORAGE_KEYS.activeProfile);
  return last === "example" || last === "user" ? last : null;
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(readLastProfile);
  const [budget, setBudget] = useState<Budget | null>(() =>
    profile ? loadBudget(profile) : null,
  );

  // Save whenever the budget changes
  useEffect(() => {
    if (profile && budget) saveBudget(profile, budget);
  }, [profile, budget]);

  function updateBudget(change: (draft: Budget) => void) {
    setBudget((current) => {
      if (!current) return current;
      const draft = structuredClone(current);
      change(draft);
      return draft;
    });
  }

  /** Opens a budget. The example always starts fresh, so it looks the same every visit. */
  function enterProfile(newProfile: Profile) {
    writeStorage(STORAGE_KEYS.activeProfile, newProfile);
    setProfile(newProfile);
    setBudget(newProfile === "example" ? createFreshBudget("example") : loadBudget("user"));
    window.location.hash = "home";
    window.scrollTo({ top: 0 });
  }

  /** Closes the budget and shows the welcome page */
  function showWelcome() {
    writeStorage(STORAGE_KEYS.activeProfile, null);
    setProfile(null);
    setBudget(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <BudgetContext.Provider
      value={{ profile, budget, updateBudget, setBudget, enterProfile, showWelcome }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

/** Use this inside any component to read or change the budget */
export function useBudget() {
  const value = useContext(BudgetContext);
  if (!value) throw new Error("useBudget must be used inside <BudgetProvider>");
  return value;
}

/** Same as useBudget, but for components that only show up while a budget is open */
export function useOpenBudget() {
  const value = useBudget();
  if (!value.budget || !value.profile) throw new Error("No budget is open");
  return {
    ...value,
    budget: value.budget,
    profile: value.profile,
    getCategory: (name: string): Category | undefined =>
      value.budget!.categories.find((category) => category.name === name),
  };
}
