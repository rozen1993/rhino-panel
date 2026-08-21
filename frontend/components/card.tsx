import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[10px] border border-line bg-panel shadow-[0_4px_14px_rgba(3,29,54,.045)] ${className}`} {...props} />;
}
