import Link from "next/link";
import { Avatar } from "@/components/avatar";

export function TopBar({ name, initials, backHref }: { name: string; initials: string; backHref?: string }) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-line bg-panel px-4 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && <Link aria-label="Volver" className="text-2xl leading-none text-ink" href={backHref}>←</Link>}
        <span className="truncate text-base font-bold tracking-tight sm:text-lg">Rhino Audiovisuales</span>
      </div>
      <div className="flex items-center gap-2"><Avatar initials={initials} size="sm" /><span className="hidden text-sm font-semibold sm:inline">{name}</span></div>
    </header>
  );
}
