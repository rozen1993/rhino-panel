export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow",
  },
] as const;

export function applySecurityHeaders(headers: Headers) {
  securityHeaders.forEach(({ key, value }) => headers.set(key, value));
}
