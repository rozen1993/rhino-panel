import { defineConfig } from "../../frontend/node_modules/@playwright/test";
import base from "../../frontend/playwright.config";
import { resolve } from "node:path";

export default defineConfig({
  ...base,
  testDir: resolve(__dirname, "../../frontend/e2e"),
  testMatch: ["calendar-consistency.spec.ts", "historical-panel.spec.ts", "historical-approved.spec.ts", "history-contract.spec.ts", "aunor.spec.ts"],
  reporter: [["list"], ["html", {open:"never",outputFolder:resolve(__dirname,"../../frontend/.verificacion/calendarios-2026-10-05/report")}]],
  outputDir: resolve(__dirname,"../../frontend/.verificacion/calendarios-2026-10-05/results"),
  webServer: {
    ...base.webServer,
    // Run the isolated demo build created by `npm run verify`, not a work-data server.
    command: "npm run start -- -p 3100",
    cwd: resolve(__dirname,"../../frontend"),
    env: {SISTEMA_R_DATA_SOURCE:"demo",SISTEMA_R_ISOLATED_TEST:"audit"},
    url: "http://localhost:3100",
    reuseExistingServer: false,
  },
});
