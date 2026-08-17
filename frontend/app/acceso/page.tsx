import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";

type LocalAccount = { name: string; initials: string };

export default function AccessPage() {
  // En Fase 2 no simulamos cuentas recordadas: un dispositivo nuevo empieza vacío.
  const localAccounts: readonly LocalAccount[] = [];

  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-paper">
      <header className="flex min-h-16 items-center justify-between border-b border-line bg-panel px-4"><Link aria-label="Volver a la portada" className="text-2xl leading-none" href="/">←</Link><span className="text-base font-bold tracking-tight">Rhino Audiovisuales</span><span aria-hidden="true" className="w-5" /></header>
      <main className="space-y-5 px-3 py-5">
        <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">Acceso privado</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Entra a tu cuenta</h1><p className="mt-1 text-sm text-ink-muted">Usa el usuario y la clave que te asignaron.</p></header>

        <Card className="p-4">
          <form className="space-y-4">
            <FormField autoComplete="username" id="username" label="Usuario" placeholder="Tu usuario" required />
            <FormField autoComplete="current-password" id="password" label="Clave" placeholder="Tu clave" required type="password" />
            <div className="text-right"><a className="text-xs font-bold text-blue underline underline-offset-4" href="#">¿Olvidaste tu clave?</a></div>
            <Button className="w-full" type="button">Entrar</Button>
          </form>
        </Card>

        <section aria-labelledby="device-title" className="space-y-2">
          <div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-blue">Atajo local</p><h2 className="mt-1 text-base font-bold" id="device-title">En este dispositivo</h2></div>
          {localAccounts.length > 0 ? localAccounts.map((account) => <button className="flex min-h-16 w-full items-center gap-3 rounded-[5px] border border-line bg-panel p-3 text-left" key={account.name} type="button"><Avatar initials={account.initials} size="sm" /><span><span className="block text-sm font-bold">{account.name}</span><span className="mt-0.5 block text-xs text-ink-muted">Entrar con esta cuenta</span></span></button>) : <Card className="p-4"><p className="text-sm font-bold">Todavía no hay cuentas guardadas.</p><p className="mt-1 text-xs leading-5 text-ink-muted">Cuando alguien entre con éxito desde aquí, podrá volver tocando su cuenta.</p></Card>}
        </section>
      </main>
    </div>
  );
}
