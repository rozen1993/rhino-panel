export type IconName = "activities" | "calendar" | "progress" | "complete" | "add" | "history" | "profile" | "burson" | "accounts" | "import" | "search" | "link" | "location" | "trash" | "messages" | "eye" | "edit" | "camera" | "video" | "drone" | "check" | "arrow-right";

export function SystemIcon({ name, className = "size-6" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common}>
      {name === "edit" && <><path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" /></>}
      {name === "camera" && <><path d="M8 6l2-3h4l2 3h4v14H4V6h4Z" /><circle cx="12" cy="13" r="4" /></>}
      {name === "video" && <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-4v12l-6-4" /></>}
      {name === "drone" && <><rect x="9" y="9" width="6" height="6" rx="1" /><path d="m9 9-4-4m10 4 4-4M9 15l-4 4m10-4 4 4" /><ellipse cx="5" cy="5" rx="4" ry="2" /><ellipse cx="19" cy="5" rx="4" ry="2" /><ellipse cx="5" cy="19" rx="4" ry="2" /><ellipse cx="19" cy="19" rx="4" ry="2" /></>}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "arrow-right" && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {name === "eye" && <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}
      {name === "messages" && <><path d="M3 4h18v13H9l-6 4V4Z" /><path d="M7 8h10M7 12h7" /></>}
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
      {name === "trash" && <><path d="M4 7h16M9 3h6l1 4H8l1-4Z" /><path d="m6 7 1 14h10l1-14M10 11v6m4-6v6" /></>}
    </svg>
  );
}
