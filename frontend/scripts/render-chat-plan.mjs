import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(frontendRoot, "..", "docs", "plan-chat-ia-reutilizable.html");
const target = resolve(frontendRoot, "..", "docs", "plan-chat-ia-reutilizable.pdf");

await mkdir(dirname(target), { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: target,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
} finally {
  await browser.close();
}

process.stdout.write(`${target}\n`);
