import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages deploys to /enchanted-forest/; local dev stays at /.
const base = process.env.GITHUB_PAGES === "true" ? "/enchanted-forest/" : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@config": path.resolve(__dirname, "config"),
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
