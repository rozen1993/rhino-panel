import { WorkspaceLoading } from "@/components/workspace-loading";

export default function Loading() {
  return <div className="p-4 md:p-6"><WorkspaceLoading label="Abriendo tu contrato" description="Estamos consultando los trabajos y las metas." section="Contrato"/></div>;
}
