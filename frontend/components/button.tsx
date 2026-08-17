import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };
const styles = {
  primary: "border-amber bg-amber text-ink hover:bg-amber/85",
  secondary: "border-line bg-panel text-blue hover:bg-panel-secondary",
} as const;

export function Button({ className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-[5px] border px-5 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} type={type} {...props} />;
}
