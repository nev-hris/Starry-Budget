/* Which page is showing, taken from the end of the URL:
   ...#home, ...#transactions, ...#monthly, ...#yearly, ...#income
   The nav links just change the URL; this hook notices and returns the page.
   (Hash URLs also work on GitHub Pages when you refresh.) */

import { useEffect, useState } from "react";
import type { PageName } from "../types";

const PAGES: PageName[] = ["home", "transactions", "monthly", "yearly", "income"];

function pageFromHash(): PageName {
  const name = window.location.hash.slice(1) as PageName;
  return PAGES.includes(name) ? name : "home";
}

export function useHashPage(): PageName {
  const [page, setPage] = useState<PageName>(pageFromHash);

  useEffect(() => {
    function handleHashChange() {
      setPage(pageFromHash());
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return page;
}
