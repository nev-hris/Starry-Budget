/* =========================================================
   YEAR FIELD: type the year, or (optionally) use the wheel
   ---------------------------------------------------------
   The text box is the real form field. The "Use the wheel" button
   shows a scrollable list of years; whatever the wheel lands on is
   written into the text box, and typing a full year moves the
   wheel to match.
   ========================================================= */

import { useRef, useState } from "react";
import { OLDEST_BIRTH_YEAR } from "../config/defaults";
import { today } from "../lib/dates";
import type { FormField } from "./FormContext";

const WHEEL_ITEM_HEIGHT = 40; // must match .wheel-item height in 10-year-wheel.css

/** Is this text a full year the wheel offers? */
export function isValidBirthYear(text: string): boolean {
  const year = Number(text);
  return /^\d{4}$/.test(text) && year >= OLDEST_BIRTH_YEAR && year <= today.getFullYear();
}

// "" = Not set, then this year down to the oldest year
const currentYear = today.getFullYear();
const WHEEL_VALUES: string[] = [""];
for (let year = currentYear; year >= OLDEST_BIRTH_YEAR; year -= 1) {
  WHEEL_VALUES.push(String(year));
}

export default function YearWheelField({ field }: { field: FormField }) {
  const inputId = `field-${field.name}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [wheelOpen, setWheelOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const indexOfYear = (text: string) => Math.max(0, WHEEL_VALUES.indexOf(text));

  /** Marks one item as chosen and writes its value into the text box */
  function selectIndex(index: number) {
    const safeIndex = Math.max(0, Math.min(WHEEL_VALUES.length - 1, index));
    setSelectedValue(WHEEL_VALUES[safeIndex]);
    inputRef.current!.value = WHEEL_VALUES[safeIndex];
    return safeIndex;
  }

  function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth") {
    listRef.current!.scrollTo({ top: selectIndex(index) * WHEEL_ITEM_HEIGHT, behavior });
  }

  // "Use the wheel" / "Hide the wheel"
  function toggleWheel() {
    const opening = !wheelOpen;
    setWheelOpen(opening);
    // The wheel can only scroll once it's visible; jump to the typed year (or "Not set")
    if (opening) {
      const list = listRef.current!;
      list.parentElement!.hidden = false; // show it right away so it can scroll
      scrollToIndex(indexOfYear(inputRef.current!.value), "auto");
    }
  }

  // Typing: only digits allowed (so no minus sign); a full valid year moves the wheel
  function handleInput() {
    const input = inputRef.current!;
    input.value = input.value.replace(/\D/g, "");
    if (!wheelOpen) return;
    if (input.value === "" || isValidBirthYear(input.value)) {
      const typed = input.value;
      listRef.current!.scrollTo({ top: indexOfYear(typed) * WHEEL_ITEM_HEIGHT, behavior: "auto" });
      setSelectedValue(typed);
    }
  }

  // Scrolling: whichever item is in the middle band becomes the chosen one.
  // (Skipped while the person is typing, so the wheel never overwrites their text.)
  function handleScroll() {
    if (document.activeElement === inputRef.current) return;
    selectIndex(Math.round(listRef.current!.scrollTop / WHEEL_ITEM_HEIGHT));
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const current = selectedValue === null ? -1 : WHEEL_VALUES.indexOf(selectedValue);
    if (event.key === "ArrowDown") scrollToIndex(current + 1);
    else if (event.key === "ArrowUp") scrollToIndex(current - 1);
    else return;
    event.preventDefault();
  }

  // Touching or mouse-wheeling the wheel means "I'm using the wheel now"
  const stopTyping = () => inputRef.current?.blur();

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{field.label}</label>
      <div className="year-entry">
        <input
          ref={inputRef}
          className="input year-typed"
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          id={inputId}
          name={field.name}
          defaultValue={String(field.value ?? "")}
          placeholder="e.g. 1995"
          onInput={handleInput}
        />
        <button
          type="button"
          className="btn year-wheel-toggle"
          aria-expanded={wheelOpen}
          onClick={toggleWheel}
        >
          {wheelOpen ? "Hide the wheel" : "Use the wheel"}
        </button>
      </div>
      <div className="year-wheel" hidden={!wheelOpen}>
        <ul
          ref={listRef}
          className="wheel-list"
          tabIndex={0}
          aria-label={field.label}
          onScroll={handleScroll}
          onPointerDown={stopTyping}
          onWheel={stopTyping}
          onKeyDown={handleKeyDown}
        >
          {WHEEL_VALUES.map((value, index) => (
            <li
              key={value || "not-set"}
              className={`wheel-item${value === selectedValue ? " is-selected" : ""}`}
              onClick={() => scrollToIndex(index)}
            >
              {value === "" ? (
                "Not set"
              ) : (
                <>
                  {value} <small>age {currentYear - Number(value)}</small>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <small>
        Type a year from {OLDEST_BIRTH_YEAR} to {currentYear}, or leave it empty.
      </small>
    </div>
  );
}
