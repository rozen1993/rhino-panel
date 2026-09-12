"use client";

import { useRef, useState } from "react";
import { restoreSupabaseActivityAction } from "@/app/papelera/actions";
import { formatActivityDates } from "@/components/activity-card";
import { Button } from "@/components/button";
import { ErasureControl } from "@/components/erasure-control";
import { Card } from "@/components/card";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import { useAccounts } from "@/lib/account-store";
import type { AssignableOperator } from "@/lib/accounts";
import {
  actorFromRole,
  restoreActivity,
  useSimulatedActivities,
  type SimulatedActivity,
} from "@/lib/activity-simulation";
import type { DataSource } from "@/lib/data-source";
import type { Role } from "@/lib/roles";

function moment(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export function TrashDashboard({
  role,
  dataSource,
  initialActivities = [],
  initialOperators = [],
}: {
  role: Role;
  dataSource: DataSource;
  initialActivities?: SimulatedActivity[];
  initialOperators?: AssignableOperator[];
}) {
  const simulated = useSimulatedActivities(dataSource === "demo");
  const demoAccounts = useAccounts();
  const [serverActivities, setServerActivities] = useState(initialActivities);
  const [replacementByActivity, setReplacementByActivity] = useState<
    Record<string, string>
  >({});
  const pendingActivityIdsRef = useRef(new Set<string>());
  const [pendingActivityIds, setPendingActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const [notice, setNotice] = useState("");
  const operators =
    dataSource === "supabase"
      ? initialOperators
      : demoAccounts
          .filter(
            (account) => account.active && account.roleId === "operario",
          )
          .map((account) => ({
            id: account.id,
            name: account.name,
            bursonLinked: account.bursonLinked,
          }));
  const activities = (
    dataSource === "supabase" ? serverActivities : simulated
  )
    .filter((activity) => Boolean(activity.deletedAt))
    .sort((left, right) =>
      (right.deletedAt ?? "").localeCompare(left.deletedAt ?? ""),
    );

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => noticeRef.current?.focus(), 0);
  }

  function restore(item: SimulatedActivity) {
    const currentResponsible = operators.find(
      (operator) => operator.id === item.responsibleAccountId,
    );
    const responsibleIsAssignable =
      Boolean(currentResponsible);
    const needsReplacement =
      item.status !== "Entregada" && !responsibleIsAssignable;
    const replacement = needsReplacement
      ? replacementByActivity[item.id] || null
      : null;
    if (needsReplacement && !replacement) {
      announce(
        `${item.title}: el responsable ya no está activo. Elige un Operario activo para restaurar.`,
      );
      return;
    }

    if (dataSource === "supabase") {
      if (pendingActivityIdsRef.current.has(item.id)) return;
      pendingActivityIdsRef.current.add(item.id);
      setPendingActivityIds(new Set(pendingActivityIdsRef.current));
      void (async () => {
        try {
          const result = await restoreSupabaseActivityAction(
            item.id,
            item.version,
            replacement,
          );
          announce(
            result.ok
              ? `Actividad restaurada. ${item.title} volvió a su panel.`
              : `${item.title}: ${result.error}`,
          );
          if (result.ok)
            setServerActivities((current) =>
              current.filter((activity) => activity.id !== item.id),
            );
        } catch {
          announce(
            `${item.title}: no se pudo completar la restauración. Inténtalo nuevamente.`,
          );
        } finally {
          pendingActivityIdsRef.current.delete(item.id);
          setPendingActivityIds(new Set(pendingActivityIdsRef.current));
        }
      })();
      return;
    }

    const result = restoreActivity(
      window.localStorage,
      window.localStorage,
      item.id,
      actorFromRole(role),
      item.version,
      replacement,
    );
    announce(
      result.ok
        ? `Actividad restaurada. ${item.title} volvió a su panel.`
        : `${item.title}: ${result.error}`,
    );
  }

  return (
    <div className="space-y-4">
      {activities.length>0 && role.id==="admin" && <div className="flex justify-end"><ErasureControl kind="trash" dataSource={dataSource} onDeleted={()=>{setServerActivities([]);announce("Papelera vaciada definitivamente.");}} /></div>}
      <p
        aria-atomic="true"
        aria-live="polite"
        className={
          notice
            ? "rounded-md border border-cyan/40 bg-cyan/10 p-3 text-sm font-bold text-ink shadow-[var(--shadow-1)]"
            : "sr-only"
        }
        ref={noticeRef}
        role="status"
        tabIndex={-1}
      >
        {notice}
      </p>

      {activities.length === 0 ? (
        <Card className="grid min-h-56 place-items-center p-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-lime/15 text-[#4d7b00]">
              <SystemIcon className="size-6" name="trash" />
            </span>
            <h2 className="section-title mt-4 text-xl">La Papelera está vacía</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Las actividades dadas de baja aparecerán aquí sin perder su
              planificación, ejecución, conversación ni auditoría.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activities.map((item) => {
            const currentResponsible = operators.find(
              (operator) => operator.id === item.responsibleAccountId,
            );
            const responsibleIsAssignable =
              Boolean(currentResponsible);
            const needsReplacement =
              item.status !== "Entregada" && !responsibleIsAssignable;
            const availableOperators = operators;
            const selectId = `restore-responsible-${item.id}`;
            const restoring = pendingActivityIds.has(item.id);

            return (
              <article key={item.id}>
                <Card className="h-full overflow-hidden shadow-[var(--shadow-2)]">
                  <div className="h-1 bg-gradient-to-r from-orange via-cyan to-lime" />
                  <div className="p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="data-label text-[#8a5200]">
                          {item.origin === "burson"
                            ? "ENCARGO BURSON"
                            : item.type.toUpperCase()}
                        </p>
                        <h2 className="section-title mt-1 text-xl leading-tight">
                          {item.title}
                        </h2>
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    <dl className="mt-4 grid gap-3 rounded-md border border-line bg-panel-secondary/60 p-4 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="data-label text-ink-muted">Responsable</dt>
                        <dd className="mt-1 font-extrabold">{item.responsible}</dd>
                      </div>
                      <div>
                        <dt className="data-label text-ink-muted">Jornadas</dt>
                        <dd className="mt-1 font-extrabold">
                          {formatActivityDates(item)}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-label text-ink-muted">Dada de baja por</dt>
                        <dd className="mt-1 font-extrabold">
                          {item.deletedBy?.name ?? "Admin"}
                        </dd>
                      </div>
                      <div>
                        <dt className="data-label text-ink-muted">Momento</dt>
                        <dd className="mt-1 font-extrabold">
                          {item.deletedAt ? moment(item.deletedAt) : "Sin fecha"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 rounded-md border-l-4 border-orange bg-orange/[.08] p-4">
                      <p className="data-label text-[#8a5200]">Motivo de la baja</p>
                      <p className="mt-2 text-sm leading-6 text-ink">
                        {item.deletionReason}
                      </p>
                    </div>

                    {needsReplacement && (
                      <div className="mt-4">
                        <label
                          className="data-label text-ink-muted"
                          htmlFor={selectId}
                        >
                          Nuevo Operario responsable
                        </label>
                        <select
                          className="mt-2 min-h-11 w-full rounded-md border border-line bg-panel px-3 text-sm outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"
                          disabled={restoring}
                          id={selectId}
                          onChange={(event) =>
                            setReplacementByActivity((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          value={replacementByActivity[item.id] ?? ""}
                        >
                          <option value="">Selecciona un Operario activo</option>
                          {availableOperators.map((operator) => (
                            <option key={operator.id} value={operator.id}>
                              {operator.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs leading-5 text-ink-muted">
                          El responsable anterior ya no puede recibir trabajo abierto. Elige un Operario activo.{" "}
                          La restauración conservará todo lo demás.
                        </p>
                      </div>
                    )}

                    <Button
                      aria-busy={restoring}
                      className="mt-4 w-full sm:w-auto"
                      disabled={
                        restoring ||
                        (needsReplacement &&
                          (!replacementByActivity[item.id] ||
                            availableOperators.length === 0))
                      }
                      onClick={() => restore(item)}
                    >
                      {restoring ? "Restaurando…" : "Restaurar actividad"}
                    </Button>
                  </div>
                </Card>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
