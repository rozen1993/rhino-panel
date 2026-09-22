"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatActivityDates } from "@/components/activity-card";
import { StatusPill } from "@/components/status-pill";
import { SystemIcon } from "@/components/system-icon";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import type { TrashServerResult } from "@/app/papelera/actions";
import styles from "./activity-detail.module.css";

export function OwnActivityTrashControl({ item, disabled, onConfirm }: {
  item: SimulatedActivity; disabled?: boolean;
  onConfirm: (reason: string) => Promise<TrashServerResult>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const titleId = useId(), descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    cancelButton.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, [open]);

  function close() {
    if (submitting.current) return;
    dialog.current?.close();
    setOpen(false); setReason(""); setError("");
    trigger.current?.focus();
  }
  async function confirm() {
    if (submitting.current || reason.trim().length < 2 || reason.trim().length > 1000) return;
    submitting.current = true; setPending(true); setError("");
    try {
      const result = await onConfirm(reason.trim());
      if (!result.ok) setError(result.error);
      else { submitting.current = false; close(); }
    } catch {
      setError("No se pudo confirmar el resultado. Cierra y recarga la página antes de reintentar.");
    } finally { submitting.current = false; setPending(false); }
  }

  return <>
    <button ref={trigger} type="button" disabled={disabled} className={`${styles.manageButton} ${styles.deleteButton}`}
      onClick={() => setOpen(true)}><SystemIcon name="trash" className="size-4" />Eliminar actividad</button>
    {open && <dialog ref={dialog} className={styles.dialog} tabIndex={-1} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), textarea:not(:disabled)"));
        const first = controls[0], last = controls.at(-1);
        if (!first) { event.preventDefault(); event.currentTarget.focus(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
      <div className={styles.dialogHeading}>
        <span className={styles.trashSymbol}><SystemIcon name="trash" /></span>
        <div><p className="data-label text-red">Eliminar actividad</p><h2 id={titleId} className="display-title mt-1 text-2xl">¿Enviar a Papelera?</h2></div>
      </div>
      <p id={descriptionId} className="mt-4 text-sm leading-6 text-ink-muted">Dejará de aparecer en los paneles y en Histórico. Admin podrá recuperarla mientras no se vacíe la Papelera.</p>
      <div className={styles.dialogActivity}>
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="data-label text-cyan-ink">{item.type}</span><StatusPill status={item.status} /></div>
        <p className="mt-3 break-words text-sm font-bold">{item.title}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted"><SystemIcon name="calendar" className="size-4 shrink-0" />{formatActivityDates(item)}</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); void confirm(); }}>
        <label className="block text-xs font-bold">Motivo de eliminación (obligatorio)
          <textarea required minLength={2} maxLength={1000} disabled={pending} value={reason}
            onChange={event => setReason(event.target.value)} placeholder="Ej. Actividad creada por error"
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-line bg-panel p-3 text-sm font-normal" />
        </label>
        <p className="mt-2 text-xs leading-5 text-ink-muted">Se conservarán el material, las jornadas y el historial junto con este motivo.</p>
        {error && <p role="alert" className="mt-3 text-sm font-bold text-red">{error}</p>}
        <div className={styles.dialogButtons}>
          <button ref={cancelButton} type="button" disabled={pending} onClick={close} className={styles.cancelButton}>Cancelar</button>
          <button type="submit" className={styles.confirmButton} disabled={pending || reason.trim().length < 2 || reason.trim().length > 1000}>
            {pending ? "Enviando…" : "Enviar a Papelera"}
          </button>
        </div>
      </form>
    </dialog>}
  </>;
}
