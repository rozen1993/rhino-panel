import { MobileShell, requireRole } from "@/components/mobile-shell";
import { AdminContractCenter } from "@/components/admin-contract-center";
import { getAunorWorkspaceAction } from "@/app/aunor/actions";
import { calendarDateInLima } from "@/lib/historical";
import { Suspense } from "react";
import { WorkspaceLoading } from "@/components/workspace-loading";
export default async function ContractCenterPage({
  searchParams,
}: PageProps<"/contrato">) {
  const role = await requireRole((r) => r.id === "admin");
  return (
    <MobileShell role={role} active="Contrato">
      <main className="mx-auto max-w-[1500px] px-3 py-5 md:px-6">
        <header className="mb-5">
          <p className="data-label text-cyan-ink">
            Gestión contractual · Admin
          </p>
          <h1 className="display-title mt-1 text-3xl">Centro de contrato</h1>
          <p className="mt-2 text-sm text-ink-muted">
            El mes contractual nace de la fecha registrada. Las excepciones se
            revisan aquí.
          </p>
        </header>
        <Suspense fallback={<WorkspaceLoading label="Abriendo tu contrato" description="Estamos consultando los trabajos y las metas." icon="complete" />}>
          <ContractContent searchParams={searchParams} />
        </Suspense>
      </main>
    </MobileShell>
  );
}

async function ContractContent({ searchParams }: Pick<PageProps<"/contrato">, "searchParams">) {
  const [result, params] = await Promise.all([
    getAunorWorkspaceAction({ scene: "acordado" }),
    searchParams,
  ]);
  if (!result.ok) throw Error("No se pudo cargar el centro de contrato.");
  const month = typeof params.mes === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(params.mes)
    ? params.mes : calendarDateInLima().slice(0, 7);
  return <AdminContractCenter initial={result.data} initialMonth={month} />;
}
