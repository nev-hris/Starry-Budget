import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // The site lives at https://nev-hris.github.io/Starry-Budget/
  // so every file path has to start with /Starry-Budget/.
  // (If you ever rename the GitHub repo, change this to match.)
  base: "/Starry-Budget/",

  // host: true = also open the dev server to other devices on your
  // Wi-Fi (phone, tablet). `npm run dev` prints the "Network" address.
  server: { host: true },
});
