import { expect, test } from "@playwright/test";

test("el build de producción aplica cabeceras y bloquea indexación", async ({
  page,
  request,
}) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response?.headers() ?? {};

  expect(headers["content-security-policy"]).toBe(
    "base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  );
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toBe("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
  expect(headers["x-powered-by"]).toBeUndefined();

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex, nofollow/i,
  );

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /");
  expect(robots.headers()["x-robots-tag"]).toBe("noindex, nofollow");

  const redirect = await request.get("/actividades", { maxRedirects: 0 });
  expect([303, 307, 308]).toContain(redirect.status());
  expect(redirect.headers().location).toBe("/acceso");
  expect(redirect.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(redirect.headers()["strict-transport-security"]).toBe(
    "max-age=63072000",
  );
  expect(redirect.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
