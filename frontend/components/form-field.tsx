import type { InputHTMLAttributes } from "react";

type FormFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id: string; label: string };

export function FormField({ id, label, required = false, className = "", ...props }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-bold text-ink" htmlFor={id}>{label}{required && <span aria-label="obligatorio" className="ml-1 text-red">*</span>}</label>
      <input className="min-h-11 rounded-[5px] border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-muted" id={id} required={required} {...props} />
    </div>
  );
}
