import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    // I worktree degli agenti (.claude/worktrees/*) sono copie del repo dentro
    // il repo: senza questa esclusione ogni test girerebbe una volta per copia,
    // compreso l'import MIMIT locale che scrive sul database di produzione.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
