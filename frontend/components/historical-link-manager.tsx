"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FormField } from "@/components/form-field";
import { SystemIcon } from "@/components/system-icon";

const initialHistoricalLink = "https://onedrive.live.com/";

export function HistoricalLinkManager() {
  const [link, setLink] = useState(initialHistoricalLink);
  const [savedLink, setSavedLink] = useState(initialHistoricalLink);
  const [saved, setSaved] = useState(false);

  function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedLink(link);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">Enlace actual</p>
        <p className="mt-2 break-all text-sm font-semibold text-ink">{savedLink}</p>
        <p className="mt-2 text-xs text-ink-muted">Última actualización: 17 ago 2026 · 18:25</p>
        <a className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-line bg-panel text-sm font-bold text-blue" href={savedLink} rel="noreferrer" target="_blank">
          <SystemIcon className="size-5" name="link" /> Abrir histórico
        </a>
      </Card>

      <Card className="p-4">
        <form className="space-y-4" onSubmit={saveLink}>
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-blue">Administración</p>
            <h2 className="mt-1 text-base font-bold">Cambiar enlace</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">Pega el enlace al Excel histórico conservado en OneDrive.</p>
          </div>
          <FormField id="historical-link" label="Enlace al histórico" onChange={(event) => { setLink(event.target.value); setSaved(false); }} required type="url" value={link} />
          {saved && <p aria-live="polite" className="rounded-[5px] border border-green bg-green/10 px-3 py-2 text-sm font-semibold">Enlace actualizado en esta simulación.</p>}
          <Button className="w-full lg:ml-auto lg:w-64" type="submit">Guardar enlace</Button>
        </form>
      </Card>
    </div>
  );
}
