import type { ReactNode } from "react";
import { AunorStatusPill, aunorStatuses } from "@/components/aunor-status-pill";
import { BursonStatusPill, bursonStatuses } from "@/components/burson-status-pill";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";
import { MonthStrip } from "@/components/month-strip";
import { NavBar } from "@/components/nav-bar";
import { StatusPill, internalStatuses } from "@/components/status-pill";
import { SummaryTile } from "@/components/summary-tile";
import { SystemIcon } from "@/components/system-icon";
import { TopBar } from "@/components/top-bar";

const monthCounts = [5, 7, 6, 6, 8, 10, 9, 12, 0, 0, 0, 0] as const;

function SectionTitle({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  return <div className="mb-4 border-b border-line pb-3"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">{eyebrow}</p><h2 className="mt-1 text-lg font-bold sm:text-xl">{children}</h2></div>;
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-paper">
      <TopBar initials="MV" name="Marco Vargas" />
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-3 py-5 sm:px-7 sm:py-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue">Verificación interna</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Sistema de diseño</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Cimiento visual para las interfaces de producción de Rhino Audiovisuales. Esta ruta no forma parte de la navegación del producto.</p>
        </header>

        <Card className="p-4 sm:p-5">
          <SectionTitle eyebrow="01 · Estados internos">Siete estados operativos</SectionTitle>
          <div className="flex flex-wrap gap-2">{internalStatuses.map((status) => <StatusPill key={status} status={status} />)}</div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div><h3 className="mb-3 text-sm font-bold">Lo que ve AUNOR</h3><div className="flex flex-wrap gap-2">{aunorStatuses.map((status) => <AunorStatusPill key={status} status={status} />)}</div></div>
            <div><h3 className="mb-3 text-sm font-bold">Estados de Burson</h3><div className="flex flex-wrap gap-2">{bursonStatuses.map((status) => <BursonStatusPill key={status} status={status} />)}</div></div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle eyebrow="02 · Año 2026">Actividad mensual</SectionTitle>
          <MonthStrip activeMonth="AGO" counts={monthCounts} />
        </Card>

        <section aria-labelledby="summary-heading">
          <div className="mb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">03 · Resumen</p><h2 className="mt-1 text-lg font-bold sm:text-xl" id="summary-heading">Tarjetas de resumen</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile detail="Programadas este mes" icon={<SystemIcon className="size-9" name="activities" />} iconClassName="bg-blue text-white" label="Actividades" value={12} />
            <SummaryTile detail="3 pendientes de iniciar" icon={<SystemIcon className="size-9" name="calendar" />} iconClassName="bg-amber text-ink" label="Programadas" value={5} />
            <SummaryTile detail="Trabajo en curso" icon={<SystemIcon className="size-9" name="progress" />} iconClassName="bg-turquoise text-white" label="En proceso" value={4} />
            <SummaryTile detail="Entregadas o aprobadas" icon={<SystemIcon className="size-9" name="complete" />} iconClassName="bg-green text-ink" label="Finalizadas" value={3} />
          </div>
        </section>

        <Card className="p-4 sm:p-5">
          <SectionTitle eyebrow="04 · Navegación">Un componente, dos presentaciones</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
            <div><h3 className="mb-2 text-sm font-bold">Móvil · barra inferior</h3><div className="relative h-44 overflow-hidden rounded-[5px] border border-line bg-paper"><div className="p-4 text-xs text-ink-muted">Vista de contenido a 390 px</div><NavBar contained presentation="mobile" /></div></div>
            <div><h3 className="mb-2 text-sm font-bold">Escritorio · barra lateral</h3><div className="h-80 overflow-hidden rounded-[5px] border border-line bg-paper"><div className="h-full w-60 max-w-full"><NavBar contained presentation="desktop" /></div></div></div>
          </div>
        </Card>

        <section aria-labelledby="cards-heading">
          <div className="mb-4"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue">05 · Superficies</p><h2 className="mt-1 text-lg font-bold sm:text-xl" id="cards-heading">Tarjetas planas</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5"><h3 className="font-bold">Contenido corto</h3><p className="mt-2 text-sm text-ink-muted">Una ficha breve, delimitada por una línea fina.</p></Card>
            <Card className="p-5"><h3 className="font-bold">Contenido largo</h3><p className="mt-2 text-sm leading-6 text-ink-muted">Las coberturas, grabaciones, ediciones y piezas se organizan con una alineación estricta. El borde separa la información sin levantarla del papel y las esquinas conservan un radio discreto.</p></Card>
          </div>
        </section>

        <Card className="p-4 sm:p-5">
          <SectionTitle eyebrow="06 · Controles">Botones y campos</SectionTitle>
          <div className="flex flex-wrap gap-3"><Button>Guardar cambios</Button><Button variant="secondary">Cancelar</Button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FormField id="activity-name" label="Nombre de la actividad" placeholder="Ej. Cobertura en Panamericana Norte" required />
            <FormField id="material-link" label="Enlace al material" placeholder="https://onedrive.live.com/..." type="url" />
          </div>
        </Card>
      </main>
    </div>
  );
}
