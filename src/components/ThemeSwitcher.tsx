/* =========================================================
   LIGHT / DARK MODE BUTTON (bottom right)
   One click switches mode. Both icons sit inside the button;
   CSS shows the one for the current mode and morphs between them.
   data-label is the "Light Mode" / "Dark Mode" hover text.
   ========================================================= */

import { asset } from "../lib/assets";
import type { Theme } from "../types";

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export default function ThemeSwitcher({ theme, onToggle }: Props) {
  const label = theme === "dark" ? "Dark Mode" : "Light Mode";

  return (
    <div className="theme-switcher" id="themeSwitcher" data-label={label}>
      <button
        type="button"
        className="theme-fab"
        aria-label={`${label} (click to switch)`}
        onClick={onToggle}
      >
        <img className="theme-icon theme-icon-light" src={asset("icon-lightmode.png")} alt="" />
        <img className="theme-icon theme-icon-dark" src={asset("icon-darkmode.png")} alt="" />
      </button>
    </div>
  );
}
