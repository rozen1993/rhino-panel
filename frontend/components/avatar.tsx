export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "size-9 text-sm" : "size-11 text-base";
  return <span aria-label={`Avatar de ${initials}`} className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-[#087f99] font-bold text-white shadow-sm ${dimensions}`}>{initials}</span>;
}
