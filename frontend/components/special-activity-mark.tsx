import type { ActivityClassification } from "@/lib/activity-classification";

export function ActivityTitle({ title, value }: { title: string; value?: ActivityClassification | null }) {
  if (value !== "special") return title;
  const split = title.lastIndexOf(" ");
  return <>{title.slice(0, split + 1)}<span className="whitespace-nowrap">{title.slice(split + 1)}<SpecialActivityMark value={value}/></span></>;
}

/** Quiet panel marker; the full production seal remains in the historical view. */
export function SpecialActivityMark({ value }: { value?: ActivityClassification | null }) {
  if (value !== "special") return null;
  return <span role="img" aria-label="Actividad especial" title="Actividad especial"
    className="ml-1.5 inline-flex align-middle text-violet-ink">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 8 7 3h10l4 5-9 13Z"/><path d="M3 8h18M7 3l2 5 3 13 3-13 2-5M9 8l3-5 3 5"/>
    </svg>
  </span>;
}
