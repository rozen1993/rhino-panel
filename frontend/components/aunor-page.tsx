import { notFound } from "next/navigation";
import { MobileShell, requireRole } from "@/components/mobile-shell";
import { AunorSpace, type AunorScene } from "@/components/aunor-space";
import { resolveDataSource } from "@/lib/data-source";
import { readSupabaseAunor } from "@/lib/supabase/aunor";
import { readDemoAunor } from "@/lib/aunor-demo.server";
import { calendarDateInLima, currentLimaYear } from "@/lib/historical";
export async function AunorPage({scene,id,year}:{scene:AunorScene;id?:string;year?:number}) {
  const role=await requireRole(r=>r.id==="aunor");
  const demo=resolveDataSource()==="demo";
  const initial=demo?readDemoAunor(role):await readSupabaseAunor();
  if(id && scene==="detail" && !initial.activities.some(a=>a.id===id)) notFound();
  if(id && scene==="replacement" && !initial.replacements.some(r=>r.id===id)) notFound();
  return <MobileShell role={role} active={scene==="acordado"||scene==="replacement"?"Lo acordado":scene==="messages"?"Mensajes":"Mi panel"} backHref={scene==="detail"?"/aunor":scene==="replacement"?"/aunor/acordado":undefined}>
    <AunorSpace role={role} initial={initial} scene={scene} id={id} demo={demo} year={year??currentLimaYear()} today={calendarDateInLima()}/>
  </MobileShell>;
}
