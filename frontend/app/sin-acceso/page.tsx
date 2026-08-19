import Link from "next/link";
import { currentRole } from "@/lib/session";

export default async function AccessDeniedPage() {
  const role = await currentRole();
  const destination = role?.externalView === "aunor" ? "/aunor" : role?.externalView === "burson" ? "/burson" : role?.supervises ? "/supervision" : role?.kind === "trabajo" ? "/actividades" : "/acceso";
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12"><div className="w-full rounded-[5px] border border-red bg-panel p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-red">Acceso restringido</p><h1 className="mt-2 text-2xl font-bold">No tienes permiso para ver esta página</h1><p className="mt-2 text-sm leading-6 text-ink-muted">Tu sesión está activa, pero este módulo pertenece a otro rol. No se mostró ningún dato de la página solicitada.</p><Link className="mt-5 flex min-h-11 items-center justify-center rounded-[5px] bg-blue px-4 text-sm font-bold text-white" href={destination}>Volver a mi espacio</Link></div></main>;
}
