import { notFound } from "next/navigation";
import { requireRole } from "@/components/mobile-shell";
import { AunorSpace, type AunorScene } from "@/components/aunor-space";
import { resolveDataSource } from "@/lib/data-source";
import { readSupabaseAunor } from "@/lib/supabase/aunor";
import { readDemoAunor } from "@/lib/aunor-demo.server";
import { calendarDateInLima, currentLimaYear } from "@/lib/historical";
import { scopeAunorWorkspace, type AunorReadScope } from "@/lib/aunor-read-scope";
export async function AunorPage({scene,id,year}:{scene:AunorScene;id?:string;year?:number}) {
  const role=await requireRole(r=>r.id==="aunor");
  const demo=resolveDataSource()==="demo";
  const scope: AunorReadScope = {scene,...(id ? {id} : {})};
  const initial=demo?scopeAunorWorkspace(readDemoAunor(role),scope):await readSupabaseAunor(scope);
  if(id && scene==="detail" && !initial.activities.some(a=>a.id===id)) notFound();
  if(id && scene==="replacement" && !initial.replacements.some(r=>r.id===id)) notFound();
  return <AunorSpace key={`${role.accountId}:${scene}:${id??""}:${year??currentLimaYear()}`} role={role} initial={initial} scene={scene} id={id} demo={demo} year={year??currentLimaYear()} today={calendarDateInLima()}/>;
}
