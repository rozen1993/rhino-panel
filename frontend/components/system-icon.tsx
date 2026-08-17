export type IconName = "activities" | "calendar" | "progress" | "complete" | "add" | "history";

export function SystemIcon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common}>
      {name === "activities" && <><path d="M4 8h16v11H4z" /><path d="m4 8 2-4h14l-2 4M7 4l2 4m3-4 2 4m3-4 2 4" /></>}
      {name === "calendar" && <><rect height="16" rx="1" width="18" x="3" y="5" /><path d="M7 3v4m10-4v4M3 10h18" /></>}
      {name === "progress" && <><path d="M4 19V9m6 10V5m6 14v-7m4 7V3" /></>}
      {name === "complete" && <><rect height="16" rx="1" width="16" x="4" y="4" /><path d="m8 12 3 3 6-7" /></>}
      {name === "add" && <><rect height="18" rx="2" width="18" x="3" y="3" /><path d="M12 7v10M7 12h10" /></>}
      {name === "history" && <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" /><path d="M4 4v4.6h4.6M12 8v4l3 2" /></>}
    </svg>
  );
}
