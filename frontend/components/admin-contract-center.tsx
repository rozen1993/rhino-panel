"use client";
import dynamic from "next/dynamic";
import { useAunorWorkspace } from "@/lib/use-aunor-workspace";
import type { AunorWorkspace } from "@/lib/aunor";
import { ContractCenter } from "./contract-center";
import { Button } from "./button";

const AdminContractPeriod = dynamic(() => import("./admin-contract-period").then(m => m.AdminContractPeriod), {
  loading: () => <p role="status" className="rounded-md bg-panel-secondary p-4 text-sm text-ink-muted">Abriendo configuración de periodos…</p>,
});
export function AdminContractCenter({initial, initialMonth}: {initial: AunorWorkspace; initialMonth: string}) {
  const {w, error, refresh} = useAunorWorkspace(initial, "acordado", "");
  return <>
    {error && <div role="alert" className="mb-4 rounded-md border border-line p-4">{error}<Button variant="secondary" onClick={() => void refresh(true)}>Reintentar carga</Button></div>}
    <ContractCenter w={w} initialMonth={initialMonth} management={selected =>
      <AdminContractPeriod key={selected} w={w} activityId="" activityVersion={0} serviceOverride={selected} configOnly onAssigned={() => {}} onRefresh={() => refresh(true)}/>
    }/>
  </>;
}
