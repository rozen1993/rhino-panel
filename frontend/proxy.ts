import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveDataSource } from "@/lib/data-source";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (resolveDataSource() === "demo") return NextResponse.next();
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
