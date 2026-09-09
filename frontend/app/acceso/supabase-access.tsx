"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { LoginForm } from "@/app/acceso/login-form";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";

const entries = [
  { name: "Admin", initials: "AD", description: "Administración y planificación del equipo" },
  { name: "Operario", initials: "OP", description: "Actividades y jornadas de trabajo" },
  { name: "Aunor", initials: "AU", description: "Actividades, entregas y contrato" },
];

export function SupabaseAccessPage() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState("");
  return (
    <main className="technical-surface relative min-h-screen overflow-x-hidden px-3 py-5 text-white sm:px-6 lg:px-10 lg:py-7">
      <Link className="relative z-10 inline-flex min-h-10 items-center gap-2 text-xs text-white/80 hover:text-cyan" href="/">‹ Volver a la portada</Link>
      <header className="relative z-10 mx-auto mt-5 max-w-4xl text-center lg:mt-4">
        <h1 className="brand-condensed text-[2.45rem] leading-none sm:text-5xl lg:text-[4.1rem]">CONTROL DE ACTIVIDADES</h1>
        <p className="mt-3 text-xs font-extrabold tracking-[0.25em] text-cyan sm:text-lg">RHINO AUDIOVISUALES</p>
        <span className="mx-auto mt-3 block h-[3px] w-12 bg-lime" />
        <p className="mt-3 text-sm text-white/70">Gestión integral del equipo audiovisual</p>
        <p className="mt-4 text-sm text-white/80">Elige tu acceso e ingresa con tu usuario y contraseña.</p>
      </header>
      <section aria-label="Accesos a la plataforma" className="relative z-10 mx-auto mt-6 max-w-7xl pb-8">
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.name}>
              <Card className="grid min-h-[4.8rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 text-ink hover:border-cyan/50">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={entry.initials} />
                  <div className="min-w-0"><h2 className="display-title text-base">{entry.name}</h2><p className="text-xs text-ink-muted">{entry.description}</p></div>
                </div>
                <button aria-label={`Ingresar como ${entry.name}`} className="action-surface min-h-10 rounded-md px-4 text-xs font-extrabold text-[#173000] sm:min-w-32" onClick={(event) => { trigger.current = event.currentTarget; setSelected(entry.name); dialog.current?.showModal(); }} type="button">Ingresar ›</button>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-xs text-white/70">Acceso privado · Los permisos dependen de tu cuenta.</p>
      </section>
      <dialog aria-labelledby="access-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-[25.5rem] overflow-y-auto rounded-xl border-0 bg-transparent p-0 backdrop:bg-black/60" onClose={() => trigger.current?.focus()} ref={dialog}>
        <Card className="relative p-5 text-ink sm:p-7">
          <button aria-label="Cerrar acceso" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-line bg-white text-lg" onClick={() => dialog.current?.close()} type="button">×</button>
          <div className="pt-7 text-center"><h2 className="display-title text-xl" id="access-title">Acceso {selected}</h2><p className="mt-2 text-xs text-ink-muted">Ingresa tu usuario y tu clave personal.</p></div>
          <div className="mt-5" key={selected}><LoginForm /></div>
          <p className="mt-5 border-t border-line pt-4 text-center text-xs text-ink-muted">Sesión privada · duración máxima de 12 horas</p>
        </Card>
      </dialog>
    </main>
  );
}
