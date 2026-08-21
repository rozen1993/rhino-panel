"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { toggleAccount, upsertAccount, useAccounts } from "@/lib/account-store";
import type { Account, AccountFields } from "@/lib/accounts";
import { roleIds, roles, type Role } from "@/lib/roles";

const control = "min-h-11 w-full rounded-[5px] border border-line bg-panel px-3 py-2 text-sm";
const emptyFields: AccountFields = { name: "", username: "", password: "", roleId: "operario", bursonLinked: false };

export function AccountsDashboard({ role }: { role: Role }) {
  const accounts = useAccounts();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fields, setFields] = useState<AccountFields>(emptyFields);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const visible = accounts.filter((account) => (!query.trim() || `${account.name} ${account.username}`.toLowerCase().includes(query.trim().toLowerCase())) && (!stateFilter || String(account.active) === stateFilter));

  function closeForm() { setFormOpen(false); setEditingId(null); setFields(emptyFields); }
  function beginEdit(account: Account) { setEditingId(account.id); setFields({ name: account.name, username: account.username, password: account.password, roleId: account.roleId, bursonLinked: account.bursonLinked }); setFormOpen(true); }
  function saveAccount() { const result = upsertAccount(window.localStorage, fields, role.label, editingId ?? undefined); setNotice(result.ok ? editingId ? "Cuenta actualizada." : "Cuenta creada." : result.error); if (result.ok) closeForm(); }
  function changeState(id: string) { const result = toggleAccount(window.localStorage, id, role.label); setNotice(result.ok ? result.account.active ? "Cuenta reactivada." : "Cuenta desactivada." : result.error); setConfirmId(null); }

  return <>
    {notice && <p aria-live="polite" className="rounded-[5px] border border-blue bg-blue/10 p-3 text-sm font-bold">{notice}</p>}
    <div className="grid gap-2 md:grid-cols-[1fr_12rem_auto]">
      <label><span className="sr-only">Buscar cuenta</span><input className={control} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o usuario" type="search" value={query} /></label>
      <label><span className="sr-only">Filtrar cuentas</span><select className={control} onChange={(event) => setStateFilter(event.target.value)} value={stateFilter}><option value="">Todas</option><option value="true">Activas</option><option value="false">Inactivas</option></select></label>
      <Button onClick={() => setFormOpen(true)}>Dar de alta</Button>
    </div>
    {formOpen && <Card className="space-y-4 border-blue p-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue">{editingId ? "Editar cuenta" : "Nueva cuenta"}</p><h2 className="mt-1 text-lg font-bold">Acceso y función</h2></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-bold">Nombre<input className={`${control} mt-2`} onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))} value={fields.name} /></label>
        <label className="text-sm font-bold">Usuario<input autoComplete="off" className={`${control} mt-2`} onChange={(event) => setFields((current) => ({ ...current, username: event.target.value }))} value={fields.username} /></label>
        <label className="text-sm font-bold md:col-span-2">Clave simulada<input autoComplete="new-password" className={`${control} mt-2`} onChange={(event) => setFields((current) => ({ ...current, password: event.target.value }))} type="password" value={fields.password} /></label>
        <label className="text-sm font-bold">Rol<select className={`${control} mt-2`} onChange={(event) => setFields((current) => ({ ...current, roleId: event.target.value as AccountFields["roleId"], bursonLinked: event.target.value === "operario" ? current.bursonLinked : false }))} value={fields.roleId}>{roleIds.map((roleId) => <option key={roleId} value={roleId}>{roles[roleId].label}</option>)}</select></label>
        {fields.roleId === "operario" && <label className="flex min-h-11 items-center gap-2 self-end rounded-[5px] border border-line px-3 text-sm font-bold"><input checked={fields.bursonLinked} onChange={(event) => setFields((current) => ({ ...current, bursonLinked: event.target.checked }))} type="checkbox" />Operario especial vinculado a Burson</label>}
      </div>
      <p className="text-xs text-ink-muted">Solo puede existir un operario especial activo; él recibe automáticamente todos los encargos de Burson.</p>
      <div className="grid grid-cols-2 gap-2"><Button onClick={closeForm} variant="secondary">Cancelar</Button><Button onClick={saveAccount}>Guardar cuenta</Button></div>
    </Card>}
    <section aria-labelledby="accounts-title" className="space-y-2">
      <div className="flex items-end justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-[0.1em]" id="accounts-title">Cuentas</h2><span className="text-xs text-ink-muted">{visible.length} resultados</span></div>
      <div className="grid gap-3 lg:grid-cols-2">{visible.map((account) => <AccountCard account={account} confirmId={confirmId} key={account.id} onConfirm={changeState} onEdit={beginEdit} onPrompt={setConfirmId} />)}</div>
    </section>
  </>;
}

function AccountCard({ account, confirmId, onConfirm, onEdit, onPrompt }: { account: Account; confirmId: string | null; onConfirm: (id: string) => void; onEdit: (account: Account) => void; onPrompt: (id: string | null) => void }) {
  return <Card className="p-3"><div className="flex items-center gap-3"><Avatar initials={account.initials} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold">{account.name}</h3><p className="text-xs text-ink-muted">@{account.username}</p></div><span className={`rounded-[5px] px-2 py-1 text-[0.6875rem] font-bold ${account.active ? "bg-green text-ink" : "bg-status-gray text-white"}`}>{account.active ? "Activa" : "Inactiva"}</span></div><div className="mt-2 flex flex-wrap gap-1"><span className="rounded-[5px] bg-blue px-2 py-1 text-[0.625rem] font-bold text-white">{roles[account.roleId].label}</span>{account.bursonLinked && <span className="rounded-[5px] bg-violet-600 px-2 py-1 text-[0.625rem] font-bold text-white">Vinculado a Burson</span>}</div></div></div><details className="mt-3 border-t border-line pt-3"><summary className="cursor-pointer text-xs font-bold text-blue">Auditoría ({account.history.length})</summary><div className="mt-2 space-y-1">{account.history.map((entry, index) => <p className="text-xs text-ink-muted" key={`${entry.moment}-${index}`}><strong className="text-ink">{entry.action}</strong> · {entry.actor}<br />{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.moment))}</p>)}</div></details>{confirmId === account.id ? <div className="mt-3 rounded-[5px] border border-red bg-red/5 p-3"><p className="text-sm font-bold">¿{account.active ? "Desactivar" : "Reactivar"} esta cuenta?</p><div className="mt-2 grid grid-cols-2 gap-2"><Button onClick={() => onPrompt(null)} variant="secondary">Volver</Button><Button onClick={() => onConfirm(account.id)}>Confirmar</Button></div></div> : <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3"><Button onClick={() => onEdit(account)} variant="secondary">Editar</Button><button className={`min-h-11 rounded-[5px] text-sm font-bold underline ${account.active ? "text-red" : "text-blue"}`} onClick={() => onPrompt(account.id)} type="button">{account.active ? "Desactivar" : "Reactivar"}</button></div>}</Card>;
}
