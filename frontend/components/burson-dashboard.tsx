"use client";
import Link from "next/link";
import { useState } from "react";
import { ActivityCard } from "@/components/activity-card";
import { ActivityForm } from "@/components/activity-form";
import { useSimulatedActivities } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";
export function BursonDashboard({ role }: { role: Role }) { const [creating, setCreating] = useState(false); const items = useSimulatedActivities().filter((item) => item.origin === "burson" && !item.deletedAt && (role.id !== "burson" || item.createdByAccountId === role.accountId)); return <div className="space-y-4">{role.id === "burson" && <button className="min-h-11 rounded-[5px] bg-amber px-5 text-sm font-bold" onClick={() => setCreating((value) => !value)} type="button">{creating ? "Cerrar formulario" : "＋ Dejar nuevo encargo"}</button>}{creating && <ActivityForm role={role} />}<section className="space-y-2"><div className="flex justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.1em]">Encargos Burson</h2><span className="text-xs text-ink-muted">{items.length}</span></div>{items.map((item) => <ActivityCard activity={item} key={item.id} showResponsible />)}{!items.length && <p className="rounded-[5px] border border-line bg-panel p-5 text-sm text-ink-muted">No hay encargos registrados.</p>}</section>{role.id === "admin" && <Link className="text-sm font-bold text-blue underline" href="/actividades">Verlos junto con todas las actividades</Link>}</div>; }
