import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };
const styles = {
  primary: "border-amber bg-amber text-[#173000] shadow-[0_5px_14px_rgba(95,170,0,.18)] hover:brightness-95",
  secondary: "border-line bg-panel text-ink hover:border-blue hover:text-blue",
} as const;

export function Button({ className = "", type = "button", variant = "primary", ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-md border px-5 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} type={type} {...props} />;
}
