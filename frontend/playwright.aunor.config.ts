import { defineConfig, devices } from "@playwright/test";
const run = process.env.SISTEMA_R_AUNOR_TEST_RUN ?? new Date().toISOString().replaceAll(/[:.]/g, "-");
process.env.SISTEMA_R_AUNOR_TEST_RUN=run;
export default defineConfig({
  testDir: "./e2e", fullyParallel: false, workers: 1, retries: 0,
  reporter: [["list"]], timeout: 60_000,
  use: { baseURL: "http://localhost:3108", ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  outputDir: `.verificacion/aunor-${run}`,
  webServer: {
    command: "npm run build && npm run start -- -p 3108",
    env: { SISTEMA_R_DATA_SOURCE: "demo", SISTEMA_R_ISOLATED_TEST: "aunor" },
    url: "http://localhost:3108", reuseExistingServer: false, timeout: 240_000,
  },
});
