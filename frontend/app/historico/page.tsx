import { AnnualCalendar } from "@/components/annual-calendar";
import { MobileShell, requireRole } from "@/components/mobile-shell";
export default async function HistoricalPage() { const role = await requireRole((item) => item.id === "admin"); return <MobileShell active="Histórico" role={role}><main className="lg:p-4 xl:p-6"><AnnualCalendar /></main></MobileShell>; }
