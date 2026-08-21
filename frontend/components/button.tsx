import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };
const styles = {
  primary: "action-surface border-lime text-[#173000] shadow-[0_7px_18px_rgba(95,170,0,.22)] hover:-translate-y-px hover:brightness-[1.02]",
  secondary: "border-line bg-panel text-ink shadow-[var(--shadow-1)] hover:border-cyan hover:text-[#08718a]",
} as const;

export function Button({ className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-md border px-5 py-2 text-sm font-extrabold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} type={type} {...props} />;
}
