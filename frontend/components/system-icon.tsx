export type IconName = "activities" | "calendar" | "progress" | "complete" | "add" | "history" | "profile" | "burson" | "accounts" | "import" | "search" | "link" | "location";

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
      {name === "profile" && <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>}
      {name === "burson" && <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0m0-5a5 5 0 0 1 6 5" /></>}
      {name === "accounts" && <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0m1-5.5A5 5 0 0 1 21.5 19" /></>}
      {name === "import" && <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v4h16v-4" /></>}
      {name === "search" && <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>}
      {name === "link" && <><path d="m10 13.5 4-4" /><path d="M8.5 16.5 7 18a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M15.5 7.5 17 6a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" /></>}
      {name === "location" && <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
    </svg>
  );
}
