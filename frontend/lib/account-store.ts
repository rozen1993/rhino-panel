"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  accountsCookieName,
  defaultAccounts,
  parseAccounts,
  serializeAccountsCookie,
  type Account,
  type AccountFields,
} from "@/lib/accounts";
import { passwordPolicyError } from "@/lib/password-policy";

export const accountStoreKey = "rhino:cuentas-simuladas:v3";
const changedEvent = "rhino:cuentas-simuladas-cambio-v3";
const seedSnapshot = JSON.stringify(defaultAccounts);
const serverSnapshot = () => seedSnapshot;

export function readAccounts(storage: Pick<Storage, "getItem">) {
  return parseAccounts(storage.getItem(accountStoreKey));
}
function save(storage: Pick<Storage, "setItem">, accounts: Account[]) {
  storage.setItem(accountStoreKey, JSON.stringify(accounts));
  // Esta cookie sincroniza fixtures mutables con Server Components. Es una
  // comodidad de demo, no una frontera de autenticacion; Vercel rechaza demo.
  document.cookie = `${accountsCookieName}=${encodeURIComponent(serializeAccountsCookie(accounts))}; path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(changedEvent));
}
function specialCount(accounts: Account[]) {
  return accounts.filter(
    (item) => item.active && item.roleId === "operario" && item.bursonLinked,
  ).length;
}
function activeBursonCount(accounts: Account[]) {
  return accounts.filter((item) => item.active && item.roleId === "burson")
    .length;
}

export function upsertAccount(
  storage: Pick<Storage, "getItem" | "setItem">,
  fields: AccountFields,
  actor: string,
  id?: string,
) {
  const current = readAccounts(storage);
  const previous = id ? current.find((item) => item.id === id) : undefined;
  const resetsPassword = Boolean(
    fields.password && fields.password !== previous?.password,
  );
  if (!fields.name.trim() || !fields.username.trim())
    return { ok: false as const, error: "Completa nombre y usuario." };
  if (!id && !fields.password.trim())
    return { ok: false as const, error: "Genera una clave temporal." };
  if (resetsPassword && passwordPolicyError(fields.password))
    return { ok: false as const, error: passwordPolicyError(fields.password)! };
  if (fields.roleId !== "operario" && fields.bursonLinked)
    return {
      ok: false as const,
      error: "Solo un operario puede vincularse a Burson.",
    };
  if (fields.roleId !== "operario" && fields.canCreateOwnActivities)
    return {
      ok: false as const,
      error: "Solo un operario puede recibir permiso de creación propia.",
    };
  if (previous && !previous.active && fields.bursonLinked)
    return {
      ok: false as const,
      error: "Reactiva la cuenta antes de vincularla a Burson.",
    };
  if (
    previous &&
    !previous.active &&
    !previous.canCreateOwnActivities &&
    fields.canCreateOwnActivities
  )
    return {
      ok: false as const,
      error: "Reactiva la cuenta antes de conceder el permiso de creación.",
    };
  if (
    current.some(
      (item) =>
        item.id !== id &&
        item.username.toLowerCase() === fields.username.trim().toLowerCase(),
    )
  )
    return { ok: false as const, error: "Ese usuario ya está en uso." };

  const now = new Date().toISOString();
  const accountId = previous?.id ?? `account-${Date.now().toString(36)}`;
  if (fields.roleId === "aunor" && (previous?.active ?? true) && current.some((item) => item.id !== id && item.active && item.roleId === "aunor"))
    return { ok: false as const, error: "Ya existe un acceso Aunor activo. Utiliza o reactiva la cuenta compartida." };
  const next: Account = {
    id: accountId,
    name: fields.name.trim(),
    initials: fields.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    username: fields.username.trim().toLowerCase(),
    password: fields.password || previous?.password || "",
    roleId: fields.roleId,
    bursonLinked: fields.bursonLinked,
    canCreateOwnActivities: fields.canCreateOwnActivities,
    mustChangePassword: resetsPassword
      ? true
      : (previous?.mustChangePassword ?? true),
    active: previous?.active ?? true,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    updatedBy: actor,
    history: [
      {
        action:
          previous &&
          previous.canCreateOwnActivities !== fields.canCreateOwnActivities
            ? fields.canCreateOwnActivities
              ? "Permiso de creación propia concedido"
              : "Permiso de creación propia retirado"
            : previous
              ? resetsPassword
                ? "Cuenta editada y clave temporal regenerada"
                : "Cuenta editada"
              : "Cuenta creada con clave temporal",
        actor,
        moment: now,
      },
      ...(previous?.history ?? []),
    ],
  };

  const assigningSpecial =
    next.active && next.roleId === "operario" && next.bursonLinked;
  const result = [next, ...current.filter((item) => item.id !== accountId)].map(
    (item) => {
      if (!assigningSpecial || item.id === accountId || !item.bursonLinked)
        return item;
      return {
        ...item,
        bursonLinked: false,
        updatedAt: now,
        updatedBy: actor,
        history: [
          {
            action: `Vínculo Burson transferido a ${next.name}`,
            actor,
            moment: now,
          },
          ...item.history,
        ],
      };
    },
  );
  if (specialCount(result) !== 1)
    return {
      ok: false as const,
      error: "Debe existir exactamente un operario activo vinculado a Burson.",
    };
  if (!result.some((item) => item.active && item.roleId === "admin"))
    return {
      ok: false as const,
      error: "Debe permanecer al menos una cuenta Admin activa.",
    };
  if (activeBursonCount(result) !== 1)
    return {
      ok: false as const,
      error: "Debe existir exactamente una cuenta Burson activa.",
    };
  const previousSpecial = current.find(
    (item) => item.active && item.roleId === "operario" && item.bursonLinked,
  );
  save(storage, result);
  return {
    ok: true as const,
    account: next,
    specialTransfer:
      assigningSpecial && previousSpecial?.id !== next.id
        ? {
            fromAccountId: previousSpecial?.id,
            toAccountId: next.id,
            toName: next.name,
          }
        : undefined,
  };
}

export function toggleAccount(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  actor: string,
  hasOpenActivities: boolean,
) {
  const current = readAccounts(storage);
  const found = current.find((item) => item.id === id);
  if (!found) return { ok: false as const, error: "La cuenta no existe." };
  if (!found.active && found.roleId === "aunor" && current.some((item) => item.id !== id && item.active && item.roleId === "aunor"))
    return { ok: false as const, error: "Ya existe un acceso Aunor activo." };
  if (found.active && found.roleId === "operario" && hasOpenActivities)
    return {
      ok: false as const,
      error: "Reasigna primero las actividades abiertas de este Operario.",
    };
  const now = new Date().toISOString();
  const changed = {
    ...found,
    active: !found.active,
    canCreateOwnActivities: found.active
      ? false
      : found.canCreateOwnActivities,
    updatedAt: now,
    updatedBy: actor,
    history: [
      {
        action:
          found.active && found.canCreateOwnActivities
            ? "Cuenta desactivada; permiso de creación retirado"
            : "Estado de cuenta cambiado",
        actor,
        moment: now,
      },
      ...found.history,
    ],
  };
  const result = current.map((item) => (item.id === id ? changed : item));
  if (specialCount(result) !== 1)
    return {
      ok: false as const,
      error: "Debe permanecer activo el único operario vinculado a Burson.",
    };
  if (
    found.active &&
    found.roleId === "admin" &&
    current.filter((item) => item.active && item.roleId === "admin").length ===
      1
  )
    return {
      ok: false as const,
      error: "No puedes desactivar la última cuenta Admin.",
    };
  if (activeBursonCount(result) !== 1)
    return {
      ok: false as const,
      error: "Debe permanecer activa la única cuenta Burson.",
    };
  save(storage, result);
  return { ok: true as const, account: changed };
}

export function resetTemporaryPassword(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  temporaryPassword: string,
  actor: string,
) {
  const validation = passwordPolicyError(temporaryPassword);
  if (validation) return { ok: false as const, error: validation };
  const current = readAccounts(storage);
  const found = current.find((item) => item.id === id);
  if (!found) return { ok: false as const, error: "La cuenta no existe." };
  const now = new Date().toISOString();
  const account: Account = {
    ...found,
    password: temporaryPassword,
    mustChangePassword: true,
    updatedAt: now,
    updatedBy: actor,
    history: [
      {
        action: "Clave temporal regenerada; sesiones revocadas",
        actor,
        moment: now,
      },
      ...found.history,
    ],
  };
  save(
    storage,
    current.map((item) => (item.id === id ? account : item)),
  );
  return { ok: true as const, account };
}

export function completeDemoPasswordChange(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  password: string,
) {
  const validation = passwordPolicyError(password);
  if (validation) return { ok: false as const, error: validation };
  const current = readAccounts(storage);
  const found = current.find((item) => item.id === id);
  if (!found?.active || !found.mustChangePassword)
    return {
      ok: false as const,
      error: "La cuenta no tiene un cambio de clave pendiente.",
    };
  if (found.password === password)
    return {
      ok: false as const,
      error: "La nueva clave debe ser diferente de la clave temporal.",
    };
  const now = new Date().toISOString();
  const account: Account = {
    ...found,
    password,
    mustChangePassword: false,
    updatedAt: now,
    updatedBy: found.name,
    history: [
      {
        action: "Clave temporal reemplazada por el usuario",
        actor: found.name,
        moment: now,
      },
      ...found.history,
    ],
  };
  save(
    storage,
    current.map((item) => (item.id === id ? account : item)),
  );
  return { ok: true as const, account };
}

export function useAccounts() {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === accountStoreKey) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(changedEvent, notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(changedEvent, notify);
    };
  }, []);
  const snapshot = useCallback(
    () => window.localStorage.getItem(accountStoreKey) ?? seedSnapshot,
    [],
  );
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => parseAccounts(raw), [raw]);
}
