import { AunorPage } from "@/components/aunor-page";
import { parseHistoricalYear } from "@/lib/historical";
export default async function Page({searchParams}:{searchParams:Promise<{anio?:string}>}){const p=await searchParams;return <AunorPage scene="calendar" year={parseHistoricalYear(p.anio)}/>;}
