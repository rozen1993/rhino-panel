import type { ReactNode } from "react";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function AunorLayout({children}:{children:ReactNode}) {
  const role = await requireRole(r => r.id === "aunor");
  return <MobileShell key={role.accountId} role={role} active="Mi panel">{children}</MobileShell>;
}
