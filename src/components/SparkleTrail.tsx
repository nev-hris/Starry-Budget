/* =========================================================
   MAGIC SPARKLE CURSOR TRAIL
   Works like the classic "Tinkerbell Magic Sparkle" script: moving the
   mouse drops tiny stars that drift down, shrink and fade.
   Each star is a <span> that deletes itself when its animation ends.
   The look and movement live in CSS (.cursor-sparkle).

   The stars are added straight to the page (not through React),
   because creating dozens of them per second through React would
   be slow. Settings are in config/defaults.ts.
   ========================================================= */

import { useEffect } from "react";
import { MAX_SPARKLES, SPARKLE_COLORS, SPARKLE_GAP_MS } from "../config/defaults";

export default function SparkleTrail() {
  useEffect(() => {
    // Only for a real mouse, and not for people who turn off animations
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hasMouse || reduceMotion) return;

    let sparkleCount = 0;
    let lastSparkleTime = 0;

    function createSparkle(x: number, y: number) {
      if (sparkleCount >= MAX_SPARKLES) return;

      const sparkle = document.createElement("span");
      sparkle.className = "cursor-sparkle";
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];

      // Random drift, fall distance and speed make every star a little different
      sparkle.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 40}px`);
      sparkle.style.setProperty("--fall-y", `${30 + Math.random() * 50}px`);
      sparkle.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;

      sparkle.addEventListener("animationend", () => {
        sparkle.remove();
        sparkleCount -= 1;
      });

      document.body.appendChild(sparkle);
      sparkleCount += 1;
    }

    function handleMouseMove(event: MouseEvent) {
      const now = performance.now();
      if (now - lastSparkleTime < SPARKLE_GAP_MS) return;
      lastSparkleTime = now;
      createSparkle(event.clientX, event.clientY);
    }

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return null; // draws nothing itself
}
