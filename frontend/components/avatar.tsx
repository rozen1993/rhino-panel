export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "size-9 text-sm" : "size-11 text-base";
  return <span aria-label={`Avatar de ${initials}`} className={`inline-flex shrink-0 items-center justify-center rounded-[5px] bg-amber font-bold text-ink ${dimensions}`}>{initials}</span>;
}
