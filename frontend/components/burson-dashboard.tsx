"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityCard } from "@/components/activity-card";
import { ActivityForm } from "@/components/activity-form";
import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

export function BursonDashboard({ role }: { role: Role }) {
  const [creating, setCreating] = useState(false);
  const items = useSimulatedActivities().filter(
    (item) =>
      item.origin === "burson" &&
      !item.deletedAt &&
      (role.id !== "burson" || item.createdByAccountId === role.accountId),
  );
  const count = (status: string) =>
    items.filter((item) => item.status === status).length;

  return (
    <div className="space-y-4">
      <section
        aria-label="Resumen de encargos Burson"
        className="grid grid-cols-3 gap-2 md:gap-3"
      >
        <BursonMetric
          label="Programados"
          tone="cyan"
          value={count("Programada")}
        />
        <BursonMetric
          label="En proceso"
          tone="orange"
          value={count("En proceso")}
        />
        <BursonMetric
          label="Entregados"
          tone="lime"
          value={count("Entregada")}
        />
      </section>

      {role.id === "burson" && (
        <Card className="overflow-hidden shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet text-white shadow-[0_7px_18px_rgba(139,92,246,.22)]">
                <SystemIcon className="size-5" name="burson" />
              </span>
              <div>
                <p className="data-label text-violet">Asignación automática</p>
                <strong className="mt-1 block text-sm">
                  Canal directo con el operario especial
                </strong>
                <span className="mt-1 block text-xs text-ink-muted">
                  Cada encargo queda programado y asignado al crearla.
                </span>
              </div>
            </div>
            <button
              aria-expanded={creating}
              className="action-surface min-h-11 rounded-md px-5 text-sm font-extrabold text-[#173000] shadow-[0_7px_18px_rgba(95,170,0,.22)] transition hover:-translate-y-px xl:hidden"
              onClick={() => setCreating((value) => !value)}
              type="button"
            >
              {creating ? "Cerrar formulario" : "＋ Dejar nuevo encargo"}
            </button>
          </div>
        </Card>
      )}

      {role.id === "burson" && (
        <div
          className={`${creating ? "block" : "hidden"} rounded-[12px] border border-cyan/25 bg-cyan/[.04] p-2 md:p-4 xl:block`}
        >
          <ActivityForm role={role} />
        </div>
      )}

      <Card className="overflow-hidden shadow-[var(--shadow-2)]">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4 md:p-5">
          <div>
            <p className="data-label text-cyan-ink">
              Seguimiento especializado
            </p>
            <h2 className="section-title mt-1 text-xl">Encargos Burson</h2>
            <p className="mt-2 text-xs text-ink-muted">
              {items.length} encargos en el canal
            </p>
          </div>
          {role.id === "admin" && (
            <Link
              className="inline-flex min-h-10 items-center rounded-md border border-line bg-panel px-4 text-xs font-extrabold text-[#08718a] transition hover:border-cyan"
              href="/actividades"
            >
              Ver operación completa →
            </Link>
          )}
        </header>
        <div className="grid gap-3 bg-paper/55 p-3 lg:grid-cols-2 lg:p-4">
          {items.map((item) => (
            <ActivityCard activity={item} key={item.id} showResponsible />
          ))}
          {!items.length && (
            <p className="col-span-full p-8 text-center text-sm text-ink-muted">
              No hay encargos registrados.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function BursonMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "orange" | "lime";
}) {
  const color = { cyan: "bg-cyan", orange: "bg-orange", lime: "bg-lime" }[tone];
  return (
    <Card className="flex min-w-0 items-center gap-2 p-3 md:gap-3 md:p-4">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black text-night ${color}`}
      >
        {value}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold">{label}</p>
        <p className="mt-1 hidden text-[0.6875rem] text-ink-muted sm:block">
          en el canal
        </p>
      </div>
    </Card>
  );
}
