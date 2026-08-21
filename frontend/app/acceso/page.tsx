import Link from "next/link";
import { LoginForm } from "@/app/acceso/login-form";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { roles } from "@/lib/roles";
import { testUsers } from "@/lib/session";

export default function AccessPage() {
  return <main className="technical-surface min-h-screen px-3 py-5 text-white sm:px-6 lg:px-10 lg:py-8">
    <Link className="relative z-10 inline-flex min-h-10 items-center gap-2 text-xs text-white/80 hover:text-white" href="/">▣ <span>Acceso mediante contraseña</span></Link>
    <header className="relative z-10 mx-auto mt-5 max-w-4xl text-center lg:mt-8">
      <h1 className="brand-condensed text-[2.35rem] leading-none drop-shadow-lg sm:text-5xl lg:text-6xl">CONTROL DE ACTIVIDADES</h1>
      <p className="mt-3 text-sm font-extrabold tracking-[0.2em] text-blue sm:text-lg">RHINO AUDIOVISUALES</p>
      <span className="mx-auto mt-4 block h-1 w-12 bg-amber" />
      <p className="mt-4 text-sm text-white/70">Gestión integral del equipo audiovisual</p>
      <span className="mt-4 inline-flex rounded-full border border-white/30 px-6 py-3 text-sm">▣ &nbsp; Agosto 2026</span>
    </header>
    <div className="relative z-10 mx-auto mt-6 grid max-w-6xl gap-4 lg:grid-cols-[1.25fr_.75fr] lg:items-start">
      <section aria-labelledby="test-users-title">
        <h2 className="sr-only" id="test-users-title">Cuentas de prueba</h2>
        <ul className="space-y-1.5">{testUsers.map(({ roleId, user, password, accountId, name, bursonLinked }, index) => {
          const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
          return <li key={accountId}><Card className={`grid min-h-20 grid-cols-[1fr_auto] items-center gap-3 p-3 text-ink sm:grid-cols-[1.3fr_.55fr_.8fr] sm:px-5 ${index === 0 ? "border-2 border-blue" : ""}`}>
            <div className="flex items-center gap-3"><Avatar initials={initials} /><span><strong className="block text-sm sm:text-base">{name}</strong><small className="text-ink-muted">{roles[roleId].label}{bursonLinked ? " especial · encargos Burson" : ""}</small></span></div>
            <span className="hidden items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-xs font-bold text-green sm:flex"><i className="size-2 rounded-full bg-green" />Activo</span>
            <span className="text-right font-mono text-[0.6875rem] text-ink-muted"><b className="block font-sans text-sm text-ink">{user}</b>{password}</span>
          </Card></li>;
        })}</ul>
      </section>
      <Card className="p-5 text-ink lg:sticky lg:top-8 lg:p-6">
        <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-blue text-xl font-bold text-white">⌁</span><h2 className="mt-3 text-xl font-extrabold">Acceso de colaborador</h2><p className="mt-1 text-xs text-ink-muted">Ingresa tu clave personal para continuar</p></div>
        <div className="mt-5"><LoginForm /></div>
        <p className="mt-4 border-t border-line pt-4 text-center text-[0.6875rem] text-ink-muted">▣ &nbsp; Acceso seguro y privado</p>
      </Card>
    </div>
  </main>;
}
