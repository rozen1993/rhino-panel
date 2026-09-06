import { defineConfig, devices } from "@playwright/test";
const run = new Date().toISOString().replaceAll(/[:.]/g, "-");
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3107", ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  outputDir: `.verificacion/historico-${run}`,
  webServer: {
    command: "npm run build && npm run start -- -p 3107",
    env: { SISTEMA_R_DATA_SOURCE: "demo", SISTEMA_R_ISOLATED_TEST: "historico" },
    url: "http://localhost:3107",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
