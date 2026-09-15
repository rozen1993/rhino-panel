import { redirect } from "next/navigation";
import { parseHistoricalYear } from "@/lib/historical";
export default async function Page({searchParams}:{searchParams:Promise<{anio?:string}>}) {
  const params = await searchParams;
  redirect(`/aunor/historico?tipo=todos&anio=${parseHistoricalYear(params.anio)}`);
}
