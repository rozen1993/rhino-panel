import DemoAccessPage from "@/app/acceso/access-demo";
import { SupabaseAccessPage } from "@/app/acceso/supabase-access";
import { resolveDataSource } from "@/lib/data-source";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export default function AccessPage() {
  if (resolveDataSource() === "supabase") {
    getSupabaseEnvironment();
    return <SupabaseAccessPage />;
  }
  return <DemoAccessPage />;
}
