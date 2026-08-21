import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { LoginForm } from "@/app/acceso/login-form";
import { roles } from "@/lib/roles";
import { testUsers } from "@/lib/session";

type LocalAccount = { name: string; initials: string };

export default function AccessPage() {
  // En Fase 2 no simulamos cuentas recordadas: un dispositivo nuevo empieza vacío.
  const localAccounts: readonly LocalAccount[] = [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper md:max-w-[768px] lg:max-w-none">
      <header className="flex min-h-16 items-center justify-between border-b border-line bg-panel px-4"><Link aria-label="Volver a la portada" className="text-2xl leading-none" href="/">←</Link><span className="text-base font-bold tracking-tight">Rhino Audiovisuales</span><span aria-hidden="true" className="w-5" /></header>
      <main className="mx-auto max-w-2xl space-y-5 px-3 py-5 md:px-7 md:py-8 lg:py-12">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Acceso privado</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Entra a tu cuenta</h1><p className="mt-1 text-sm text-ink-muted">Usa el usuario y la clave que te asignaron.</p></header>

        <Card className="p-4"><LoginForm /></Card>

        <section aria-labelledby="test-users-title" className="space-y-2">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">Solo en pruebas</p><h2 className="mt-1 text-base font-bold" id="test-users-title">Cuentas de prueba</h2></div>
          <aside className="rounded-[5px] border border-amber bg-amber/15 p-3 text-xs font-semibold leading-5 text-ink">
            Credenciales simuladas de Fase 2 para recorrer la plataforma como cada rol. No hay servidor
            ni autenticación real: esto no protege nada y se elimina antes de producción.
          </aside>
          <ul className="grid gap-2 md:grid-cols-2">
            {testUsers.map(({ roleId, user, password, accountId }) => (
              <li key={accountId}>
                <Card className="p-3">
                  <p className="text-sm font-bold">{roles[roleId].label}</p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">{user} · {password}</p>
                  <p className="mt-2 text-xs leading-5 text-ink-muted">{roles[roleId].summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="device-title" className="space-y-2">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">Atajo local</p><h2 className="mt-1 text-base font-bold" id="device-title">En este dispositivo</h2></div>
          {localAccounts.length > 0 ? localAccounts.map((account) => <button className="flex min-h-16 w-full items-center gap-3 rounded-[5px] border border-line bg-panel p-3 text-left" key={account.name} type="button"><Avatar initials={account.initials} size="sm" /><span><span className="block text-sm font-bold">{account.name}</span><span className="mt-0.5 block text-xs text-ink-muted">Entrar con esta cuenta</span></span></button>) : <Card className="p-4"><p className="text-sm font-bold">Todavía no hay cuentas guardadas.</p><p className="mt-1 text-xs leading-5 text-ink-muted">Cuando alguien entre con éxito desde aquí, podrá volver tocando su cuenta.</p></Card>}
        </section>
      </main>
    </div>
  );
}
