import Link from "next/link";
import { LoginForm } from "@/app/acceso/login-form";
import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";

export function SupabaseAccessPage() {
  return (
    <main className="technical-surface relative grid min-h-screen overflow-hidden px-3 py-5 text-white sm:px-6 lg:px-10 lg:py-7">
      <Link
        className="relative z-10 inline-flex min-h-10 w-fit items-center gap-2 text-xs text-white/80 transition hover:text-cyan"
        href="/"
      >
        <span className="grid size-7 place-items-center rounded-full border border-white/20">
          ◁
        </span>
        <span>Volver a la portada</span>
      </Link>

      <section className="relative z-10 mx-auto grid w-full max-w-5xl content-center gap-7 pb-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-16">
        <header className="text-center lg:text-left">
          <p className="data-label text-cyan">Sistema R · acceso privado</p>
          <h1 className="brand-condensed mt-3 text-[2.7rem] leading-[0.92] drop-shadow-[0_4px_10px_rgba(0,0,0,.65)] sm:text-6xl lg:text-[4.6rem]">
            CONTROL DE
            <br />
            ACTIVIDADES
          </h1>
          <p className="mt-4 text-sm font-extrabold tracking-[0.22em] text-cyan sm:text-lg">
            RHINO AUDIOVISUALES
          </p>
          <span className="mx-auto mt-4 block h-[3px] w-14 bg-lime shadow-[0_0_14px_rgba(132,214,0,.5)] lg:mx-0" />
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/68 lg:mx-0">
            Acceso autenticado al entorno de staging. Cada operación se valida
            nuevamente en el servidor y en PostgreSQL.
          </p>
        </header>

        <Card className="relative w-full overflow-hidden p-5 text-ink shadow-[var(--shadow-3)] sm:p-7">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan to-lime" />
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full border-[5px] border-cyan/10 bg-gradient-to-br from-cyan to-[#078ca2] text-night shadow-[0_7px_18px_rgba(0,142,164,.24)]">
              <SystemIcon className="size-7" name="profile" />
            </span>
            <h2 className="display-title mt-3 text-xl">Acceso de colaborador</h2>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Ingresa tu usuario y tu clave personal.
            </p>
          </div>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-5 border-t border-line pt-4 text-center text-[0.6875rem] text-ink-muted">
            Sesión privada · duración máxima de 12 horas
          </p>
        </Card>
      </section>
    </main>
  );
}
