import { AccountsDashboard } from "@/components/accounts-dashboard";
import { MobileShell, requireRole } from "@/components/mobile-shell";

export default async function AccountsPage() {
  const role = await requireRole((candidate) => candidate.administers);
  return <MobileShell active="Cuentas" role={role}><main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7"><header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Cuentas</h1><p className="mt-1 text-sm text-ink-muted">Gestiona accesos, roles y estado de las cuentas simuladas.</p></header><aside className="rounded-[5px] border border-amber bg-amber/15 p-3 text-xs leading-5"><strong>Fase de frontend:</strong> las claves se guardan localmente solo para probar recorridos. La autenticación segura llegará con el backend.</aside><AccountsDashboard role={role} /></main></MobileShell>;
}
