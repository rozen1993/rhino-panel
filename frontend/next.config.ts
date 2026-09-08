import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // Explicit opt-in for isolated browser verification; never reuse the live dev build.
  ...(process.env.SISTEMA_R_ISOLATED_TEST === "historico" && !process.env.VERCEL ? { distDir: ".next-historical-test" } : {}),
  ...(process.env.SISTEMA_R_ISOLATED_TEST === "aunor" && !process.env.VERCEL ? { distDir: ".next-aunor-test" } : {}),
  devIndicators: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders.map((header) => ({ ...header })),
      },
    ];
  },
};

export default nextConfig;
