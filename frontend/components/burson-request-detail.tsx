"use client";

import Link from "next/link";
import { formatActivitySpans } from "@/components/activity-card";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import {
  bursonRequestViewFromActivity,
  type BursonRequestView,
} from "@/lib/burson";
import type { DataSource } from "@/lib/data-source";
import { safeMaterialUrl, safeReferenceUrl } from "@/lib/external-link";
import type { Role } from "@/lib/roles";

const dateTime = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export function BursonRequestDetail({
  dataSource,
  id,
  initialRequest,
  role,
}: {
  dataSource: DataSource;
  id: string;
  initialRequest: BursonRequestView | null;
  role: Role;
}) {
  const simulated = useSimulatedActivities(dataSource === "demo");
  const request =
    dataSource === "supabase"
      ? initialRequest
      : simulated
          .filter(
            (item) =>
              item.id === id &&
              item.origin === "burson" &&
              !item.deletedAt &&
              (role.id === "admin" ||
                (role.id === "burson" &&
                  item.createdByAccountId === role.accountId) ||
                (role.id === "operario" &&
                  item.responsibleAccountId === role.accountId)),
          )
          .map(bursonRequestViewFromActivity)[0] ?? null;

  if (!request)
    return (
      <Card className="border-red bg-red/5 p-6 font-bold text-red">
        El encargo no existe o tu cuenta no puede consultarlo.
      </Card>
    );

  const referenceUrl = safeReferenceUrl(request.referenceLink);
  const materialUrl = safeMaterialUrl(request.materialLink);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden shadow-[var(--shadow-2)]">
        <header className="technical-surface p-5 text-white md:p-6">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="data-label text-lime">{request.type} · Canal Burson</p>
              <h2 className="display-title mt-2 text-2xl leading-tight md:text-3xl">
                {request.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Seguimiento del encargo y su entrega, sin información interna de
                operación.
              </p>
            </div>
            <StatusPill status={request.status} />
          </div>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_18rem] md:p-6">
          <div>
            <p className="data-label text-ink-muted">Descripción</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
              {request.description}
            </p>
            <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-xs sm:grid-cols-2">
              <div>
                <dt className="data-label text-ink-muted">Jornadas</dt>
                <dd className="mt-1.5 font-bold leading-5">
                  {formatActivitySpans(request)}
                </dd>
              </div>
              <div>
                <dt className="data-label text-ink-muted">Lugar</dt>
                <dd className="mt-1.5 font-bold">
                  {request.place || "Sin lugar indicado"}
                </dd>
              </div>
            </dl>
          </div>

          <aside className="rounded-md border border-line bg-panel-secondary/65 p-4">
            <dl className="space-y-4 text-xs">
              <div>
                <dt className="data-label text-ink-muted">Responsable</dt>
                <dd className="mt-1.5 font-extrabold">{request.responsible}</dd>
              </div>
              <div>
                <dt className="data-label text-ink-muted">Última actualización</dt>
                <dd className="mt-1.5 font-bold">
                  {dateTime.format(new Date(request.updatedAt))}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid gap-2 border-t border-line pt-4">
              {referenceUrl && (
                <a
                  className="flex min-h-11 items-center justify-center rounded-md border border-line bg-panel px-3 text-center text-xs font-extrabold text-[#08718a]"
                  href={referenceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir referencia ↗
                </a>
              )}
              {materialUrl && (
                <a
                  className="action-surface flex min-h-11 items-center justify-center rounded-md px-3 text-center text-xs font-extrabold text-[#173000]"
                  href={materialUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir material entregado ↗
                </a>
              )}
              {!materialUrl && (
                <p className="rounded-md border border-cyan/25 bg-cyan/[.06] p-3 text-center text-[0.6875rem] font-bold text-ink-muted">
                  El material aparecerá aquí cuando el Operario lo registre.
                </p>
              )}
            </div>
          </aside>
        </div>
      </Card>

      {role.id !== "burson" && (
        <div className="flex justify-end">
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-panel px-4 text-xs font-extrabold text-[#08718a]"
            href={`/actividades/${request.id}`}
          >
            Abrir ficha operativa →
          </Link>
        </div>
      )}
    </div>
  );
}
