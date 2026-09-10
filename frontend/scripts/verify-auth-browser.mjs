import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export async function verifyAuthBrowser({
  url,
  anon,
  users,
  admin,
  adminCall,
  password,
  pass,
}) {
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  const env = {
    ...process.env,
    SISTEMA_R_ISOLATED_TEST: "audit",
    SISTEMA_R_DATA_SOURCE: "supabase",
    SUPABASE_URL: url,
    SUPABASE_PUBLISHABLE_KEY: anon,
    SISTEMA_R_USERNAME_DOMAIN: "auth-test.invalid",
  };
  delete env.VERCEL;
  delete env.VERCEL_ENV;
  let server, browser;
  const next = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  try {
    console.log(
      "Building isolated production frontend for real-auth browser tests...",
    );
    await new Promise((resolve, reject) => {
      const build = spawn(process.execPath, [next, "build"], {
        cwd,
        env,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      // No env or credential-bearing logs persisted.
      build.stdout.on("data", () => {});
      build.stderr.on("data", () => {});
      build.once("error", reject);
      build.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(Error(`Isolated Next build failed (${code})`)),
      );
    });
    const probe = createServer();
    await new Promise((r) => probe.listen(0, "127.0.0.1", r));
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    server = spawn(
      process.execPath,
      [next, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    server.stdout.on("data", () => {});
    server.stderr.on("data", () => {});
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        ready = (await fetch(`${base}/acceso`)).ok;
      } catch {}
      if (ready) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    assert.ok(ready, "isolated frontend ready");
    browser = await chromium.launch();
    async function signIn(page, name, pw) {
      await page.goto(`${base}/acceso`);
      await page
        .getByRole("button", {
          name: `Ingresar como Test ${name}`,
          exact: true,
        })
        .click();
      await page.locator('input[name="clave"]').fill(pw);
      await page
        .locator(
          'dialog button[type="submit"], [role="dialog"] button[type="submit"]',
        )
        .click();
    }
    for (const name of ["manager", "operator", "customer"]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await signIn(page, name, users[name].password);
        await page.waitForURL(
          `**/${name === "customer" ? "aunor" : "actividades"}`,
          { timeout: 20000 },
        );
        await page.goto(`${base}/cuentas`);
        if (name === "manager")
          await page
            .getByRole("heading", { name: "Gestión de cuentas" })
            .waitFor();
        else await page.waitForURL("**/sin-acceso");
        pass(
          `browser ${name}: real login, role landing and account-management access control`,
        );
      } finally {
        await context.close();
      }
    }
    const temporary = password();
    assert.equal(
      (
        await adminCall(admin, {
          action: "reset-password",
          profileId: users.customer.id,
          temporaryPassword: temporary,
        })
      ).body.ok,
      true,
    );
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await signIn(page, "customer", temporary);
      await page.waitForURL("**/cambiar-clave");
      await page.goto(`${base}/aunor`);
      await page.waitForURL("**/cambiar-clave");
      const permanent = password();
      await page.getByLabel("Nueva clave", { exact: true }).fill(permanent);
      await page
        .getByLabel("Repite la nueva clave", { exact: true })
        .fill(permanent);
      await page
        .getByRole("button", { name: "Guardar clave y continuar" })
        .click();
      await page.waitForURL("**/acceso?clave=actualizada", { timeout: 20000 });
      await signIn(page, "customer", permanent);
      await page.waitForURL("**/aunor");
      await page
        .getByRole("button", { name: "Cerrar sesión", exact: true })
        .click();
      await page.waitForURL("**/acceso");
      await page.goto(`${base}/aunor`);
      await page.waitForURL("**/acceso");
      pass(
        "browser Aunor: mandatory-password gate, server action, cookie logout and fresh login",
      );
    } finally {
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await new Promise((r) => {
        if (server.exitCode !== null) return r();
        server.once("exit", r);
        setTimeout(r, 3000);
      });
    }
  }
}
