import { Avatar } from "@/components/avatar";

export function TopBar({ name, initials }: { name: string; initials: string }) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-line bg-panel px-4 sm:px-7">
      <span className="text-base font-bold tracking-tight sm:text-lg">Rhino Audiovisuales</span>
      <div className="flex items-center gap-3"><Avatar initials={initials} size="sm" /><span className="hidden text-sm font-semibold sm:inline">{name}</span></div>
    </header>
  );
}
