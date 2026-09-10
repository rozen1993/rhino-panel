// Test transport only: run the production wrappers, including JWT verification.
import admin from "../admin-accounts/index.ts";
import change from "../change-temporary-password/index.ts";

Deno.serve(
  {
    hostname: "127.0.0.1",
    port: 0,
    onListen: ({ port }) => console.log(`PORT=${port}`),
  },
  (request) => {
    const path = new URL(request.url).pathname;
    if (path.endsWith("/admin-accounts")) return admin.fetch(request);
    if (path.endsWith("/change-temporary-password"))
      return change.fetch(request);
    return new Response("Not found", { status: 404 });
  },
);
