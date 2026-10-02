import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Contrato mantiene encabezado y navegación durante carga lenta ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    let delayedRequests = 0;
    await page.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname !== "localhost") return route.abort();
      // Latency exists only in this isolated browser, never in application code.
      if (url.pathname === "/contrato" && request.headers().rsc === "1" && !request.headers()["next-router-prefetch"]) {
        delayedRequests++;
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      await route.continue();
    });
    await page.goto("/acceso");
    await page.getByRole("listitem").filter({ hasText: "Marco Admin" }).getByRole("button", { name: "Ingresar" }).click();
    await page.locator("#usuario").fill("admin");
    await page.locator("#clave").fill("admin2026");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(url => url.pathname === "/actividades");
    const navName = width < 768 ? "Navegación móvil" : "Navegación de escritorio";
    const link = page.getByRole("navigation", { name: navName }).getByRole("link", { name: "Contrato", exact: true });
    await link.hover();
    // Let intent prefetch cache the route shell before a slow click navigation.
    await page.waitForTimeout(600);
    await page.evaluate(({ navName }) => {
      const record = { frames: 0, missingShell: 0, misplacedLoading: 0, stop: false };
      Object.assign(window, { contractNavigationRecord: record });
      const visible = (el: Element | null) => Boolean(el?.getClientRects().length);
      const sample = () => {
        record.frames++;
        const header = document.querySelector(".app-surface > header");
        const nav = document.querySelector(`nav[aria-label="${navName}"]`);
        if (!visible(header) || !visible(nav)) record.missingShell++;
        for (const indicator of document.querySelectorAll('[role="status"][aria-label="Abriendo tu contrato"]')) {
          if (visible(indicator) && !indicator.closest("#contenido-principal main")) record.misplacedLoading++;
        }
        if (!record.stop) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, { navName });
    await link.click();
    await expect(page.getByRole("heading", { name: "Centro de contrato", exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Abriendo tu contrato" })).toHaveCount(0);
    const record = await page.evaluate(() => {
      const record = (window as unknown as { contractNavigationRecord: { frames: number; missingShell: number; misplacedLoading: number; stop: boolean } }).contractNavigationRecord;
      record.stop = true;
      return record;
    });
    expect(delayedRequests).toBeGreaterThan(0);
    expect(record.frames).toBeGreaterThan(10);
    expect(record.missingShell, "No rendered frame may hide the header or menu").toBe(0);
    expect(record.misplacedLoading, "Loading must stay inside the contract content").toBe(0);
    await expect(page.getByRole("navigation", { name: navName }).getByRole("link", { name: "Contrato", exact: true })).toHaveAttribute("aria-current", "page");
  });
}
