import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "github-pages",
  base: "/podepa-multimarcas/",
  publicDir: "../public",
  plugins: [
    react(),
    {
      name: "github-pages-routes",
      closeBundle() {
        const output = path.resolve("docs");
        const index = path.join(output, "index.html");
        for (const route of ["produtos", "gerencia"]) {
          const directory = path.join(output, route);
          fs.mkdirSync(directory, { recursive: true });
          fs.copyFileSync(index, path.join(directory, "index.html"));
        }
        fs.copyFileSync(index, path.join(output, "404.html"));
        fs.writeFileSync(path.join(output, ".nojekyll"), "");
      },
    },
  ],
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
});
