export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "size-10 text-xs" : "size-12 text-sm";
  return <span aria-label={`Avatar de ${initials}`} className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-[#20c9d8] to-[#05829b] font-extrabold text-white shadow-[0_5px_14px_rgba(0,142,164,.22)] ${dimensions}`}>{initials}</span>;
}
