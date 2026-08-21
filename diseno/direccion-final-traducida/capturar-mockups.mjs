import playwright from "../../frontend/node_modules/playwright/index.js";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = pathToFileURL(join(here, "mockup.html")).href;
const captures = [
  ["01-acceso-pc.png", "acceso", 1440, 1000],
  ["02-operario-pc.png", "operario", 1440, 1000],
  ["03-admin-pc.png", "admin", 1440, 1000],
  ["04-burson-pc.png", "burson", 1440, 1000],
  ["05-historico-pc.png", "historico", 1920, 1080],
  ["06-operario-laptop.png", "operario", 1366, 768],
  ["07-admin-tablet.png", "admin", 834, 1112],
  ["08-historico-tablet.png", "historico", 834, 1112],
  ["09-operario-mobile.png", "operario", 390, 844],
  ["10-historico-mobile.png", "historico", 390, 844],
];

const browser = await playwright.chromium.launch({ headless: true });
for (const [filename, view, width, height] of captures) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${pageUrl}?view=${view}`);
  const health = await page.evaluate(() => ({
    hasContent: Boolean(document.querySelector("main")?.textContent?.trim()),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  if (pageErrors.length || !health.hasContent || health.horizontalOverflow) {
    throw new Error(`${filename}: ${pageErrors.join("; ") || JSON.stringify(health)}`);
  }
  await page.screenshot({ path: join(here, filename), fullPage: false });
  await page.close();
}
await browser.close();
console.log(`Generados ${captures.length} mockups en ${here}`);
