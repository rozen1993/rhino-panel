import DemoAccessPage from "@/app/acceso/access-demo";
import { SupabaseAccessPage } from "@/app/acceso/supabase-access";
import { resolveDataSource } from "@/lib/data-source";
import { getSupabaseEnvironment } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccessPage() {
  if (resolveDataSource() === "supabase") {
    getSupabaseEnvironment();
    const client = await createSupabaseServerClient();
    const { data, error } = await client.rpc("access_directory_v1");
    return <SupabaseAccessPage entries={error ? [] : data ?? []} month={new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "America/Lima" }).format(new Date())} />;
  }
  return <DemoAccessPage />;
}
