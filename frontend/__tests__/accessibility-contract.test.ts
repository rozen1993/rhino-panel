import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontend = resolve(process.cwd());
const css = readFileSync(join(frontend, "app", "globals.css"), "utf8");

function cssColor(name: string) {
  const match = css.match(
    new RegExp(`--(?:color-)?${name}:\\s*(#[0-9a-f]{6})`, "i"),
  );
  if (!match) throw new Error(`Falta el color --${name}`);
  return match[1];
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

const interfaceSource = ["app", "components"]
  .flatMap((directory) => sourceFiles(join(frontend, directory)))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("contrato mínimo de accesibilidad", () => {
  it("mantiene contraste AA para texto y límites visibles para controles", () => {
    const panel = cssColor("panel");
    const night = cssColor("night");

    for (const foreground of [
      "ink",
      "ink-muted",
      "cyan-ink",
      "red",
      "violet-ink",
    ]) {
      expect(contrast(cssColor(foreground), panel), foreground).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    expect(contrast(cssColor("green"), panel), "green").toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssColor("blue"), night), "cyan sobre night").toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast(cssColor("line"), panel), "límites de controles").toBeGreaterThanOrEqual(
      3,
    );
    expect(contrast(cssColor("violet"), panel), "marcadores violeta").toBeGreaterThanOrEqual(
      3,
    );
  });

  it("evita combinaciones conocidas de bajo contraste", () => {
    expect(interfaceSource).not.toMatch(
      /bg-(?:blue|cyan)(?![\w/-])[^"\n]*text-white/,
    );
    expect(interfaceSource).not.toMatch(
      /text-white[^"\n]*bg-(?:blue|cyan)(?![\w/-])/,
    );
    expect(interfaceSource).not.toContain("placeholder:text-ink-muted/");
    expect(interfaceSource).not.toMatch(/\btext-orange\b/);
    expect(readFileSync(join(frontend, "components", "annual-calendar-view.tsx"), "utf8"))
      .toContain('range: "bg-cyan/20 text-cyan-ink"');
  });

  it("conserva foco visible, salto al contenido y reducción de movimiento", () => {
    const shell = readFileSync(
      join(frontend, "components", "mobile-shell.tsx"),
      "utf8",
    );
    expect(css).toContain(":focus-visible");
    expect(css).toContain(".skip-link");
    expect(css).toContain("prefers-reduced-motion");
    expect(shell).toContain('href="#contenido-principal"');
    expect(shell).toContain('id="contenido-principal"');
  });
});
