import { BursonRequestDetail } from "@/components/burson-request-detail";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { resolveDataSource } from "@/lib/data-source";
import { getSupabaseBursonRequest } from "@/lib/supabase/activities";

export default async function BursonRequestPage({
  params,
}: PageProps<"/burson/[id]">) {
  const role = await requireRole(
    (item) =>
      item.id === "burson" || item.id === "admin" || Boolean(item.bursonLinked),
  );
  const { id } = await params;
  const dataSource = resolveDataSource();
  const request =
    dataSource === "supabase" ? await getSupabaseBursonRequest(id) : null;

  return (
    <MobileShell active="Burson" backHref="/burson" role={role}>
      <main className="mx-auto max-w-[1200px] space-y-4 px-3 py-4 md:px-5 md:py-5 lg:px-6">
        <header>
          <p className="data-label text-cyan-ink">Consulta de encargo</p>
          <h1 className="display-title mt-1 text-2xl md:text-3xl">
            Detalle Burson
          </h1>
        </header>
        <BursonRequestDetail
          dataSource={dataSource}
          id={id}
          initialRequest={request}
          role={role}
        />
      </main>
    </MobileShell>
  );
}
