/* Saving & loading in the browser (localStorage).
   Uses the SAME keys and format as the original app, so budgets
   saved by the old version still load. */

import { STORAGE_KEYS } from "../config/defaults";
import type { Budget, Profile } from "../types";
import { createFreshBudget } from "./budget";

/* Small safe wrappers: storage can be blocked (e.g. private windows),
   so every read/write is wrapped in try/catch and the app still works. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Could not save data.", error);
  }
}

/** Loads the saved budget for a profile, or a fresh one if nothing is saved */
export function loadBudget(profile: Profile): Budget {
  try {
    const saved = JSON.parse(readStorage(STORAGE_KEYS[profile]) as string);
    if (saved && Array.isArray(saved.transactions)) {
      const defaults = createFreshBudget(profile);
      // Merge so newly added settings still get a default value
      return {
        ...defaults,
        ...saved,
        settings: { ...defaults.settings, ...saved.settings },
      };
    }
  } catch (error) {
    console.warn("Saved data could not be read, starting fresh.", error);
  }
  return createFreshBudget(profile);
}

export function saveBudget(profile: Profile, budget: Budget): void {
  writeStorage(STORAGE_KEYS[profile], JSON.stringify(budget));
}
