import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[10px] border border-line/90 bg-panel shadow-[var(--shadow-1)] ${className}`} {...props} />;
}
