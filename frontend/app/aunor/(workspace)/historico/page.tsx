import { AunorPage } from "@/components/aunor-page";
import { HistoricalEntry } from "@/components/historical-entry";
import { requireRole } from "@/components/mobile-shell";
import { parseHistoricalYear, parseHistoricalCategory } from "@/lib/historical";

export default async function Page({searchParams}: {searchParams:Promise<{anio?:string;tipo?:string}>}) {
  await requireRole(r=>r.id==="aunor");
  const params = await searchParams;
  const year = parseHistoricalYear(params.anio);
  const category = parseHistoricalCategory(params.tipo);
  const calendar = category || params.tipo === "todos" || (!params.tipo && params.anio);
  return calendar ? <AunorPage scene="calendar" year={year} category={category}/> :
    <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6"><HistoricalEntry year={year} basePath="/aunor/historico"/></main>;
}
