import { AunorPage } from "@/components/aunor-page";
export default async function Page({searchParams}: PageProps<"/aunor/contrato">){
  const params = await searchParams;
  const month = typeof params.mes === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(params.mes) ? params.mes : undefined;
  return <AunorPage scene="acordado" month={month}/>;
}
