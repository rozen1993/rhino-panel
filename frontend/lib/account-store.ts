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

export const accountStoreKey = "rhino:cuentas-simuladas:v2";
const changedEvent = "rhino:cuentas-simuladas-cambio-v2";
const seedSnapshot = JSON.stringify(defaultAccounts);
const serverSnapshot = () => seedSnapshot;

export function readAccounts(storage: Pick<Storage, "getItem">) {
  return parseAccounts(storage.getItem(accountStoreKey));
}
function save(storage: Pick<Storage, "setItem">, accounts: Account[]) {
  storage.setItem(accountStoreKey, JSON.stringify(accounts));
  document.cookie = `${accountsCookieName}=${encodeURIComponent(serializeAccountsCookie(accounts))}; path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(changedEvent));
}
function specialCount(accounts: Account[]) {
  return accounts.filter(
    (item) => item.active && item.roleId === "operario" && item.bursonLinked,
  ).length;
}

export function upsertAccount(
  storage: Pick<Storage, "getItem" | "setItem">,
  fields: AccountFields,
  actor: string,
  id?: string,
) {
  const current = readAccounts(storage);
  if (!fields.name.trim() || !fields.username.trim() || !fields.password.trim())
    return { ok: false as const, error: "Completa nombre, usuario y clave." };
  if (fields.roleId !== "operario" && fields.bursonLinked)
    return {
      ok: false as const,
      error: "Solo un operario puede vincularse a Burson.",
    };
  if (
    current.some(
      (item) =>
        item.id !== id &&
        item.username.toLowerCase() === fields.username.trim().toLowerCase(),
    )
  )
    return { ok: false as const, error: "Ese usuario ya está en uso." };

  const previous = id ? current.find((item) => item.id === id) : undefined;
  const now = new Date().toISOString();
  const accountId = previous?.id ?? `account-${Date.now().toString(36)}`;
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
    password: fields.password,
    roleId: fields.roleId,
    bursonLinked: fields.bursonLinked,
    active: previous?.active ?? true,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    updatedBy: actor,
    history: [
      {
        action: previous ? "Cuenta editada" : "Cuenta creada",
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
) {
  const current = readAccounts(storage);
  const found = current.find((item) => item.id === id);
  if (!found) return { ok: false as const, error: "La cuenta no existe." };
  const now = new Date().toISOString();
  const changed = {
    ...found,
    active: !found.active,
    updatedAt: now,
    updatedBy: actor,
    history: [
      { action: "Estado de cuenta cambiado", actor, moment: now },
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
  save(storage, result);
  return { ok: true as const, account: changed };
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
