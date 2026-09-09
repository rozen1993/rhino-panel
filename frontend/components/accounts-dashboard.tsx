"use client";

import { useState, useTransition } from "react";
import {
  createSupabaseAccountAction,
  resetSupabaseTemporaryPasswordAction,
  setSupabaseOperatorCreationPermissionAction,
  updateSupabaseAccountAction,
  type AccountsServerResult,
} from "@/app/cuentas/actions";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";
import {
  resetTemporaryPassword,
  toggleAccount,
  upsertAccount,
  useAccounts,
} from "@/lib/account-store";
import {
  readActivities,
} from "@/lib/activity-simulation";
import type { Account, AccountFields } from "@/lib/accounts";
import type { DataSource } from "@/lib/data-source";
import { generateTemporaryPassword } from "@/lib/password-policy";
import { activeRoleIds, roles, type Role } from "@/lib/roles";

const control =
  "min-h-11 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none transition placeholder:text-ink-muted focus:border-cyan focus:ring-2 focus:ring-cyan/15";
const emptyFields: AccountFields = {
  name: "",
  username: "",
  password: "",
  roleId: "operario",
  bursonLinked: false,
  canCreateOwnActivities: false,
};

export function AccountsDashboard({
  role,
  dataSource = "demo",
  initialAccounts = [],
}: {
  role: Role;
  dataSource?: DataSource;
  initialAccounts?: Account[];
}) {
  const demoAccounts = useAccounts();
  const [serverAccounts, setServerAccounts] = useState(initialAccounts);
  const accounts = (dataSource === "supabase" ? serverAccounts : demoAccounts).filter(account => account.roleId !== "burson");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fields, setFields] = useState<AccountFields>(emptyFields);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [issuedCredential, setIssuedCredential] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [resetAccount, setResetAccount] = useState<Account | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const editingAccount = editingId
    ? accounts.find((account) => account.id === editingId)
    : undefined;
  const visible = accounts.filter(
    (account) =>
      (!query.trim() ||
        `${account.name} ${account.username}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (!stateFilter || String(account.active) === stateFilter),
  );

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFields(emptyFields);
  }

  function beginEdit(account: Account) {
    setEditingId(account.id);
    setFields({
      name: account.name,
      username: account.username,
      password: "",
      roleId: account.roleId,
      bursonLinked: false,
      canCreateOwnActivities: account.canCreateOwnActivities,
    });
    setFormOpen(true);
  }

  function saveAccount() {
    if (dataSource === "supabase") {
      const edited = editingId
        ? accounts.find((account) => account.id === editingId)
        : undefined;
      startTransition(async () => {
        const result = edited
          ? await updateSupabaseAccountAction(
              edited.id,
              edited.updatedAt,
              fields,
              edited.active,
            )
          : await createSupabaseAccountAction(fields);
        handleServerResult(
          result,
          edited ? "Cuenta actualizada." : "Cuenta creada.",
          edited ? null : { username: fields.username, password: fields.password },
        );
        if (result.ok) closeForm();
      });
      return;
    }
    const result = upsertAccount(
      window.localStorage,
      fields,
      role.accountName ?? role.label,
      editingId ?? undefined,
    );
    setNotice(
      result.ok
        ? editingId
          ? "Cuenta actualizada."
          : "Cuenta creada."
        : result.error,
    );
    if (result.ok) {
      if (!editingId)
        setIssuedCredential({
          username: result.account.username,
          password: result.account.password,
        });
      closeForm();
    }
  }

  function changeState(id: string) {
    const account = accounts.find((item) => item.id === id);
    if (!account) return;
    if (dataSource === "supabase") {
      startTransition(async () => {
        const result = await updateSupabaseAccountAction(
          account.id,
          account.updatedAt,
          {
            name: account.name,
            username: account.username,
            password: "",
            roleId: account.roleId,
            bursonLinked: false,
            canCreateOwnActivities: account.canCreateOwnActivities,
          },
          !account.active,
        );
        handleServerResult(
          result,
          account.active ? "Cuenta desactivada." : "Cuenta reactivada.",
        );
        setConfirmId(null);
      });
      return;
    }
    const hasOpenActivities = Boolean(
      account.active &&
      account.roleId === "operario" &&
      readActivities(window.localStorage).some(
        (activity) =>
          activity.responsibleAccountId === account.id &&
          activity.status !== "Entregada" &&
          !activity.deletedAt,
      ),
    );
    if (hasOpenActivities) {
      setNotice("Reasigna primero las actividades abiertas de este Operario.");
      setConfirmId(null);
      return;
    }
    const result = toggleAccount(
      window.localStorage,
      id,
      role.accountName ?? role.label,
      hasOpenActivities,
    );
    setNotice(
      result.ok
        ? result.account.active
          ? "Cuenta reactivada."
          : "Cuenta desactivada."
        : result.error,
    );
    setConfirmId(null);
  }

  function handleServerResult(
    result: AccountsServerResult,
    success: string,
    credential: { username: string; password: string } | null = null,
  ) {
    setNotice(result.ok ? success : result.error);
    if (!result.ok) return;
    setServerAccounts(result.accounts);
    if (credential) setIssuedCredential(credential);
  }

  function toggleCreationPermission(account: Account) {
    if (dataSource === "supabase") {
      startTransition(async () =>
        handleServerResult(
          await setSupabaseOperatorCreationPermissionAction(
            account.id,
            !account.canCreateOwnActivities,
          ),
          account.canCreateOwnActivities
            ? "Permiso de creación retirado."
            : "Permiso de creación concedido.",
        ),
      );
      return;
    }
    const result = upsertAccount(
      window.localStorage,
      {
        name: account.name,
        username: account.username,
        password: "",
        roleId: account.roleId,
        bursonLinked: false,
        canCreateOwnActivities: !account.canCreateOwnActivities,
      },
      role.accountName ?? role.label,
      account.id,
    );
    setNotice(
      result.ok
        ? account.canCreateOwnActivities
          ? "Permiso de creación retirado."
          : "Permiso de creación concedido."
        : result.error,
    );
  }

  function beginReset(account: Account) {
    setResetAccount(account);
    setResetPassword(generateTemporaryPassword());
  }

  function confirmReset() {
    if (!resetAccount) return;
    const credential = {
      username: resetAccount.username,
      password: resetPassword,
    };
    if (dataSource === "supabase") {
      startTransition(async () => {
        const result = await resetSupabaseTemporaryPasswordAction(
          resetAccount.id,
          resetPassword,
        );
        handleServerResult(result, "Clave temporal regenerada.", credential);
        if (result.ok) setResetAccount(null);
      });
      return;
    }
    const result = resetTemporaryPassword(
      window.localStorage,
      resetAccount.id,
      resetPassword,
      role.accountName ?? role.label,
    );
    setNotice(result.ok ? "Clave temporal regenerada." : result.error);
    if (result.ok) {
      setIssuedCredential(credential);
      setResetAccount(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p
          aria-live="polite"
          className="rounded-md border border-cyan/40 bg-cyan/10 p-3 text-sm font-bold shadow-[var(--shadow-1)]"
        >
          {notice}
        </p>
      )}

      {issuedCredential && (
        <Card className="border-lime/45 bg-lime/[.08] p-4 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="data-label text-[#376300]">Mostrar una sola vez</p>
              <h2 className="section-title mt-1 text-lg">Credencial temporal</h2>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                Entrégala por un canal seguro. El usuario deberá cambiarla al
                ingresar y el sistema no podrá volver a mostrarla.
              </p>
            </div>
            <Button
              onClick={() => setIssuedCredential(null)}
              variant="secondary"
            >
              Ocultar
            </Button>
          </div>
          <dl className="mt-3 grid gap-2 rounded-md border border-lime/35 bg-panel p-3 font-mono text-sm sm:grid-cols-2">
            <div>
              <dt className="data-label text-ink-muted">Usuario</dt>
              <dd className="mt-1 break-all">{issuedCredential.username}</dd>
            </div>
            <div>
              <dt className="data-label text-ink-muted">Clave temporal</dt>
              <dd className="mt-1 break-all">{issuedCredential.password}</dd>
            </div>
          </dl>
        </Card>
      )}

      {resetAccount && (
        <Card className="border-orange/40 bg-orange/[.07] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-xs font-bold">
              Nueva clave temporal para {resetAccount.name}
              <input
                autoComplete="new-password"
                className={`${control} mt-1.5 font-mono`}
                readOnly
                value={resetPassword}
              />
            </label>
            <Button
              disabled={pending}
              onClick={() => setResetPassword(generateTemporaryPassword())}
              variant="secondary"
            >
              Regenerar
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setResetAccount(null);
                setResetPassword("");
              }}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button disabled={pending} onClick={confirmReset}>
              Confirmar y revocar sesiones
            </Button>
          </div>
        </Card>
      )}

      <section
        aria-label="Resumen de cuentas"
        className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3"
      >
        <AccountMetric label="Cuentas" tone="cyan" value={accounts.length} />
        <AccountMetric
          label="Activas"
          tone="lime"
          value={accounts.filter((account) => account.active).length}
        />
        <AccountMetric
          label="Operarios"
          tone="orange"
          value={
            accounts.filter((account) => account.roleId === "operario").length
          }
        />
        <AccountMetric
          label="Aunor"
          tone="violet"
          value={
            accounts.filter((account) => account.roleId === "aunor" && account.active)
              .length
          }
        />
      </section>

      <Card className="overflow-hidden shadow-[var(--shadow-2)]">
        <header className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label text-cyan-ink">Directorio operativo</p>
            <h2 className="section-title mt-1 text-xl">Equipo y accesos</h2>
            <p className="mt-2 text-xs text-ink-muted">
              {visible.length} de {accounts.length} cuentas visibles
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(13rem,1fr)_10rem_auto]">
            <label className="relative">
              <span className="sr-only">Buscar cuenta</span>
              <SystemIcon
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                name="search"
              />
              <input
                className={`${control} pl-9`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar persona o usuario"
                type="search"
                value={query}
              />
            </label>
            <label>
              <span className="sr-only">Filtrar cuentas</span>
              <select
                className={control}
                onChange={(event) => setStateFilter(event.target.value)}
                value={stateFilter}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </label>
            <Button
              disabled={pending}
              onClick={() => {
                setEditingId(null);
                setFields({
                  ...emptyFields,
                  password: generateTemporaryPassword(),
                });
                setFormOpen(true);
              }}
            >
              ＋ Dar de alta
            </Button>
          </div>
        </header>

        {formOpen && (
          <section className="border-b border-cyan/30 bg-cyan/[.045] p-4 md:p-5">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="data-label text-cyan-ink">
                    {editingId ? "Editar cuenta" : "Nueva cuenta"}
                  </p>
                  <h3 className="section-title mt-1 text-lg">
                    Acceso y función
                  </h3>
                </div>
                <button
                  aria-label="Cerrar formulario"
                  className="grid size-9 place-items-center rounded-full border border-line bg-panel text-lg font-bold hover:border-cyan"
                  onClick={closeForm}
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-bold">
                  Nombre
                  <input
                    className={`${control} mt-1.5`}
                    onChange={(event) =>
                      setFields((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={fields.name}
                  />
                </label>
                <label className="text-xs font-bold">
                  Usuario
                  <input
                    autoComplete="off"
                    className={`${control} mt-1.5`}
                    readOnly={Boolean(editingId && dataSource === "supabase")}
                    onChange={(event) =>
                      setFields((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    value={fields.username}
                  />
                </label>
                {!editingId && (
                  <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                    <label className="text-xs font-bold">
                      Clave temporal
                      <input
                        autoComplete="new-password"
                        className={`${control} mt-1.5 font-mono`}
                        readOnly
                        spellCheck={false}
                        value={fields.password}
                      />
                    </label>
                    <Button
                      onClick={() =>
                        setFields((current) => ({
                          ...current,
                          password: generateTemporaryPassword(),
                        }))
                      }
                      variant="secondary"
                    >
                      Generar
                    </Button>
                  </div>
                )}
                <label className="text-xs font-bold">
                  Rol
                  <select
                    className={`${control} mt-1.5`}
                    onChange={(event) =>
                      setFields((current) => ({
                        ...current,
                        roleId: event.target.value as AccountFields["roleId"],
                        bursonLinked: false,
                        canCreateOwnActivities:
                          event.target.value === "operario"
                            ? current.canCreateOwnActivities
                            : false,
                      }))
                    }
                    value={fields.roleId}
                  >
                    {activeRoleIds.map((roleId) => (
                      <option key={roleId} value={roleId}>
                        {roles[roleId].label}
                      </option>
                    ))}
                  </select>
                </label>
                {fields.roleId === "operario" && (
                  <div className="grid gap-2 md:col-span-2 lg:col-span-3 lg:grid-cols-2">
                    <label className="flex min-h-11 items-center gap-3 rounded-md border border-lime/35 bg-lime/[.08] px-3 text-xs font-bold">
                      <input
                        checked={fields.canCreateOwnActivities}
                        className="size-4 accent-lime"
                        disabled={
                          editingAccount?.active === false &&
                          !editingAccount.canCreateOwnActivities
                        }
                        onChange={(event) =>
                          setFields((current) => ({
                            ...current,
                            canCreateOwnActivities: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      Permitir que cree actividades propias
                    </label>
                  </div>
                )}
                <div
                  className={`grid grid-cols-2 gap-2 ${fields.roleId === "operario" ? "lg:col-start-4" : "md:col-start-2 lg:col-start-4"}`}
                >
                  <Button onClick={closeForm} variant="secondary">
                    Cancelar
                  </Button>
                  <Button disabled={pending} onClick={saveAccount}>
                    {pending ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-[0.6875rem] text-ink-muted">
                Admin administra los accesos y el permiso de creación propia.
              </p>
            </div>
          </section>
        )}

        <div className="grid gap-3 bg-paper/55 p-3 md:grid-cols-2 md:p-4 xl:grid-cols-3">
          {visible.map((account) => (
            <AccountCard
              account={account}
              confirmId={confirmId}
              key={account.id}
              onConfirm={changeState}
              onEdit={beginEdit}
              onPermission={toggleCreationPermission}
              onPrompt={setConfirmId}
              onReset={beginReset}
            />
          ))}
          {!visible.length && (
            <p className="col-span-full p-8 text-center text-sm text-ink-muted">
              No hay cuentas que coincidan con los filtros.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AccountMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "lime" | "orange" | "violet";
}) {
  const colors = {
    cyan: "bg-cyan",
    lime: "bg-lime",
    orange: "bg-orange",
    violet: "bg-[#7c3aed] text-white",
  };
  return (
    <Card className="flex items-center gap-3 p-3 md:p-4">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${colors[tone]}`}
      >
        {value}
      </span>
      <div>
        <p className="data-label text-ink-muted">{label}</p>
        <p className="mt-1 text-xs font-extrabold">en el sistema</p>
      </div>
    </Card>
  );
}

function AccountCard({
  account,
  confirmId,
  onConfirm,
  onEdit,
  onPermission,
  onPrompt,
  onReset,
}: {
  account: Account;
  confirmId: string | null;
  onConfirm: (id: string) => void;
  onEdit: (account: Account) => void;
  onPermission: (account: Account) => void;
  onPrompt: (id: string | null) => void;
  onReset: (account: Account) => void;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] ${account.active ? "" : "opacity-70"}`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${account.active ? "bg-cyan" : "bg-status-gray"}`}
      />
      <div className="flex items-center gap-3">
        <Avatar initials={account.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold">
                {account.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                @{account.username}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[0.625rem] font-extrabold ${account.active ? "bg-lime/15 text-[#376300]" : "bg-status-gray/15 text-ink-muted"}`}
            >
              {account.active ? "● ACTIVA" : "○ INACTIVA"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-night px-2 py-1 text-[0.625rem] font-bold text-white">
              {roles[account.roleId].label}
            </span>
            {account.canCreateOwnActivities && (
              <span className="rounded-md bg-lime/15 px-2 py-1 text-[0.625rem] font-bold text-[#376300]">
                Creación propia autorizada
              </span>
            )}
            {account.mustChangePassword && (
              <span className="rounded-md bg-orange/15 px-2 py-1 text-[0.625rem] font-bold text-[#8a5200]">
                Cambio de clave pendiente
              </span>
            )}
          </div>
        </div>
      </div>

      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-xs font-bold text-[#08718a]">
          Auditoría · {account.history.length} eventos
        </summary>
        <div className="mt-2 max-h-32 space-y-2 overflow-y-auto rounded-md bg-panel-secondary p-3">
          {account.history.map((entry, index) => (
            <p
              className="text-[0.6875rem] leading-5 text-ink-muted"
              key={`${entry.moment}-${index}`}
            >
              <strong className="text-ink">{entry.action}</strong> ·{" "}
              {entry.actor}
              <br />
              {new Intl.DateTimeFormat("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Lima",
              }).format(new Date(entry.moment))}
            </p>
          ))}
        </div>
      </details>

      {confirmId === account.id ? (
        <div className="mt-3 rounded-md border border-red/35 bg-red/5 p-3">
          <p className="text-xs font-extrabold">
            ¿{account.active ? "Desactivar" : "Reactivar"} esta cuenta?
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={() => onPrompt(null)} variant="secondary">
              Volver
            </Button>
            <Button onClick={() => onConfirm(account.id)}>Confirmar</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Button onClick={() => onEdit(account)} variant="secondary">
            Editar
          </Button>
          <Button onClick={() => onReset(account)} variant="secondary">
            Restablecer clave
          </Button>
          {account.roleId === "operario" && (
            <Button
              disabled={!account.active && !account.canCreateOwnActivities}
              onClick={() => onPermission(account)}
              title={
                !account.active && !account.canCreateOwnActivities
                  ? "Reactiva la cuenta antes de conceder el permiso."
                  : undefined
              }
              variant="secondary"
            >
              {account.canCreateOwnActivities
                ? "Retirar creación"
                : "Permitir creación"}
            </Button>
          )}
          <button
            className={`min-h-11 rounded-md text-xs font-extrabold underline underline-offset-4 ${account.active ? "text-red" : "text-[#08718a]"}`}
            onClick={() => onPrompt(account.id)}
            type="button"
          >
            {account.active ? "Desactivar" : "Reactivar"}
          </button>
        </div>
      )}
    </Card>
  );
}
