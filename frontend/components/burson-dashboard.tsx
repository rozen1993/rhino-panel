"use client";
import Link from "next/link";
import { useState } from "react";
import { ActivityCard } from "@/components/activity-card";
import { ActivityForm } from "@/components/activity-form";
import { SystemIcon } from "@/components/system-icon";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";

export function BursonDashboard({ role }: { role: Role }) {
  const [creating, setCreating] = useState(false);
  const items = useSimulatedActivities().filter((item) => item.origin === "burson" && !item.deletedAt && (role.id !== "burson" || item.createdByAccountId === role.accountId));
  return <div className="space-y-4">
    {role.id === "burson" && <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-line bg-panel p-4 shadow-[0_8px_24px_rgba(2,19,38,0.05)]"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-violet text-white"><SystemIcon className="size-5" name="burson" /></span><div><strong className="block text-sm">Canal de encargos</strong><span className="text-xs text-ink-muted">Cada encargo llegará al operario especial.</span></div></div><button className="min-h-11 rounded-md bg-lime px-5 text-sm font-extrabold text-night" onClick={() => setCreating((value) => !value)} type="button">{creating ? "Cerrar formulario" : "＋ Dejar nuevo encargo"}</button></div>}
    {creating && <ActivityForm role={role} />}
    <section className="space-y-3"><div className="flex items-end justify-between"><div><p className="text-[0.625rem] font-extrabold uppercase tracking-[0.18em] text-cyan">Seguimiento</p><h2 className="section-title mt-1 text-xl">Encargos Burson</h2></div><span className="text-xs font-semibold text-ink-muted">{items.length} encargos</span></div><div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <ActivityCard activity={item} key={item.id} showResponsible />)}</div>{!items.length && <p className="rounded-[10px] border border-line bg-panel p-6 text-sm text-ink-muted">No hay encargos registrados.</p>}</section>
    {role.id === "admin" && <Link className="inline-flex text-sm font-extrabold text-blue underline decoration-cyan underline-offset-4" href="/actividades">Verlos junto con todas las actividades</Link>}
  </div>;
}
