"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { LoginForm } from "@/app/acceso/login-form";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";

type Entry = { username: string; display_name: string; role: string };
const labels: Record<string, string> = { admin: "Admin", operario: "Operario", aunor: "Aunor" };
export function SupabaseAccessPage({ entries, month }: { entries: Entry[]; month: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  function open(event: React.MouseEvent<HTMLButtonElement>, entry: Entry | null) {
    trigger.current = event.currentTarget;
    setSelected(entry);
    dialog.current?.showModal();
  }
  return (
    <main className="technical-surface relative min-h-screen overflow-x-hidden px-3 py-5 text-white sm:px-6 lg:px-10 lg:py-7">
      <Link className="relative z-10 inline-flex min-h-10 items-center gap-2 text-xs text-white/80 transition hover:text-cyan" href="/"><span className="grid size-7 place-items-center rounded-full border border-white/20">▣</span><span>Acceso mediante contraseña</span></Link>
      <header className="relative z-10 mx-auto mt-5 max-w-4xl text-center lg:mt-4">
        <h1 className="brand-condensed text-[2.45rem] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,.65)] sm:text-5xl lg:text-[4.1rem]">CONTROL DE ACTIVIDADES</h1>
        <p className="mt-3 text-xs font-extrabold tracking-[0.25em] text-cyan sm:text-lg">DaVinci</p>
        <span className="mx-auto mt-3 block h-[3px] w-12 bg-lime shadow-[0_0_14px_rgba(132,214,0,.5)]" />
        <p className="mt-3 text-sm text-white/70">Gestión integral del equipo audiovisual</p>
        <span className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/[.025] px-6 py-2.5 text-sm"><SystemIcon className="size-4 text-cyan" name="calendar" /><span className="capitalize">{month}</span></span>
      </header>
      <section aria-label="Cuentas de acceso" className="relative z-10 mx-auto mt-6 max-w-7xl pb-8 lg:mt-5">
        <ul className="space-y-2">
          {entries.map(entry => <li key={entry.username}>
            <Card className="grid min-h-[4.8rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-ink transition duration-200 hover:-translate-y-px hover:border-cyan/50 hover:shadow-[var(--shadow-2)] lg:grid-cols-[minmax(16rem,1.25fr)_9rem_8rem_14rem_8.5rem]">
              <div className="flex min-w-0 items-center gap-3"><Avatar initials={entry.display_name.split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase()} /><div className="min-w-0"><h2 className="display-title truncate text-base">{entry.display_name}</h2><p className="text-xs text-ink-muted">{labels[entry.role] ?? entry.role}</p></div></div>
              <span className="hidden items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-xs font-bold text-green lg:flex"><i className="size-2 rounded-full bg-green" />Activo</span>
              <span className="hidden border-l border-line pl-4 lg:block"><b className="display-title block text-xl">—</b><small className="text-[0.625rem] text-ink-muted">actividades al ingresar</small></span>
              <span className="hidden border-l border-line pl-4 text-[0.625rem] text-ink-muted lg:block">◷ &nbsp; Última actualización<br />Disponible al ingresar</span>
              <button aria-label={`Ingresar como ${entry.display_name}`} className="action-surface min-h-10 rounded-md px-4 text-xs font-extrabold text-[#173000] shadow-[0_6px_14px_rgba(95,170,0,.2)]" onClick={event => open(event, entry)} type="button">Ingresar ›</button>
            </Card>
          </li>)}
        </ul>
        {!entries.length && <p role="status" className="text-center text-sm">No se pudo cargar el listado. Puedes ingresar con tu usuario.</p>}
        <div className="mt-5 text-center"><button className="min-h-10 text-xs underline underline-offset-4" onClick={event => open(event, null)} type="button">Ingresar con otro usuario</button></div>
      </section>
      <dialog aria-labelledby="access-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-[25.5rem] overflow-y-auto rounded-xl border-0 bg-transparent p-0 backdrop:bg-black/60" onClose={() => trigger.current?.focus()} ref={dialog}>
        <Card className="relative p-5 text-ink sm:p-7">
          <button aria-label="Cerrar acceso" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-line bg-white text-lg" onClick={() => dialog.current?.close()} type="button">×</button>
          <div className="pt-7 text-center"><h2 className="display-title text-xl" id="access-title">Acceso de colaborador</h2>{selected && <><strong className="mt-1 block text-sm">{selected.display_name}</strong><p className="text-xs text-ink-muted">{labels[selected.role]}</p></>}<p className="mt-4 text-xs text-ink-muted">Ingresa tu clave personal para continuar.</p></div>
          <div className="mt-5" key={selected?.username ?? "manual"}><LoginForm initialUser={selected?.username} /></div>
          <p className="mt-5 border-t border-line pt-4 text-center text-xs text-ink-muted">Acceso seguro y privado</p>
        </Card>
      </dialog>
    </main>
  );
}
