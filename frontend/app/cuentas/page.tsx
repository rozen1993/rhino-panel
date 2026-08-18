import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { accounts } from "@/lib/accounts";

export default async function AccountsPage() {
  const role = await requireRole((r) => r.administers);
  return (
    <MobileShell active="Cuentas" role={role}>
      <main className="space-y-5 px-3 py-4 md:px-6 md:py-6 lg:px-7">
        <header className="flex items-end justify-between gap-3"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Administración</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Cuentas</h1><p className="mt-1 text-sm text-ink-muted">Gestiona el acceso y los roles confirmados.</p></div><Button className="shrink-0 px-3">Dar de alta</Button></header>

        <aside className="rounded-[5px] border border-amber bg-amber/15 p-3 text-xs leading-5"><span className="font-bold">Datos pendientes:</span> no se asignan roles a partir de los mockups. Solo Martín tiene un rol confirmado hoy.</aside>

        <section aria-labelledby="accounts-title" className="space-y-2">
          <div className="flex items-end justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="accounts-title">Personas</h2><span className="text-xs text-ink-muted">4 cuentas de maqueta</span></div>
          <div className="space-y-2 lg:hidden">{accounts.map((account) => (
            <Card className="p-3" key={account.name}>
              <div className="flex items-center gap-3"><Avatar initials={account.initials} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold">{account.name}</h3><span className={`rounded-[5px] px-2 py-1 text-[0.6875rem] font-bold ${account.active ? "bg-green text-ink" : "bg-status-gray text-white"}`}>{account.active ? "Activa" : "Inactiva"}</span></div><div className="mt-2 flex flex-wrap gap-1.5">{account.roles.length > 0 ? account.roles.map((role) => <span className="rounded-[5px] bg-blue px-2 py-1 text-[0.6875rem] font-bold text-white" key={role}>{role}</span>) : <span className="rounded-[5px] border border-amber bg-amber/15 px-2 py-1 text-[0.6875rem] font-bold">Rol pendiente de confirmar</span>}</div></div></div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3"><Button className="min-h-10 px-2 text-xs" variant="secondary">Asignar rol</Button>{account.roles.length > 0 ? <Button className="min-h-10 px-2 text-xs" variant="secondary">Quitar rol</Button> : <Button className="min-h-10 px-2 text-xs" variant="secondary" disabled>Quitar rol</Button>}<button className="col-span-2 min-h-9 text-xs font-bold text-red underline underline-offset-4" type="button">Desactivar cuenta</button></div>
            </Card>
          ))}</div>
          <div className="hidden overflow-hidden rounded-[5px] border border-line bg-panel lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-panel-secondary text-[0.6875rem] uppercase tracking-[0.1em] text-blue"><tr><th className="px-4 py-3" scope="col">Persona</th><th className="px-4 py-3" scope="col">Rol o roles</th><th className="w-36 px-4 py-3" scope="col">Estado</th><th className="w-[22rem] px-4 py-3 text-center" scope="col">Acciones</th></tr></thead>
              <tbody className="divide-y divide-line">{accounts.map((account) => <tr key={account.name}><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar initials={account.initials} /><strong>{account.name}</strong></div></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{account.roles.length > 0 ? account.roles.map((role) => <span className="rounded-[5px] bg-blue px-2 py-1 text-[0.6875rem] font-bold text-white" key={role}>{role}</span>) : <span className="rounded-[5px] border border-amber bg-amber/15 px-2 py-1 text-[0.6875rem] font-bold">Rol pendiente de confirmar</span>}</div></td><td className="px-4 py-3"><span className={`rounded-[5px] px-2 py-1 text-[0.6875rem] font-bold ${account.active ? "bg-green text-ink" : "bg-status-gray text-white"}`}>{account.active ? "Activa" : "Inactiva"}</span></td><td className="px-4 py-3"><div className="flex items-center justify-center gap-2"><Button className="min-h-9 px-3 text-xs" variant="secondary">Asignar rol</Button><Button className="min-h-9 px-3 text-xs" variant="secondary" disabled={account.roles.length === 0}>Quitar rol</Button><button className="min-h-9 px-2 text-xs font-bold text-red underline underline-offset-4" type="button">Desactivar</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
