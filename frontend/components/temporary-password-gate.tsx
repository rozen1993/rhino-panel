"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { changeSupabaseTemporaryPasswordAction } from "@/app/cambiar-clave/actions";
import { salir } from "@/app/acceso/actions";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { completeDemoPasswordChange } from "@/lib/account-store";
import type { DataSource } from "@/lib/data-source";
import { passwordPolicyError } from "@/lib/password-policy";
import { roleHome, type Role } from "@/lib/roles";

export function TemporaryPasswordGate({
  dataSource,
  role,
}: {
  dataSource: DataSource;
  role: Role;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    const validation = passwordPolicyError(password);
    if (validation) return setNotice(validation);
    if (password !== confirmation)
      return setNotice("Las dos claves deben coincidir.");

    startTransition(async () => {
      const result =
        dataSource === "supabase"
          ? await changeSupabaseTemporaryPasswordAction(password)
          : completeDemoPasswordChange(
              window.localStorage,
              role.accountId ?? "",
              password,
            );
      if (!result.ok) return setNotice(result.error);
      setNotice("Clave actualizada.");
      router.replace(
        dataSource === "supabase"
          ? "/acceso?clave=actualizada"
          : roleHome(role.id),
      );
      router.refresh();
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-8">
      <Card className="w-full max-w-xl overflow-hidden shadow-[var(--shadow-2)]">
        <div className="technical-surface p-6 text-white md:p-8">
          <p className="data-label text-cyan-ink">ACCESO PROTEGIDO</p>
          <h1 className="display-title mt-2 text-3xl">Cambia tu clave temporal</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Admin generó una credencial inicial. Ningún módulo operativo se
            habilitará hasta que la reemplaces.
          </p>
        </div>
        <form className="space-y-4 p-5 md:p-8" onSubmit={submit}>
          {notice && (
            <p
              aria-live="polite"
              className="rounded-md border border-cyan/35 bg-cyan/10 p-3 text-sm font-bold"
            >
              {notice}
            </p>
          )}
          <label className="block text-sm font-bold">
            Nueva clave
            <input
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-md border border-line px-3 outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <label className="block text-sm font-bold">
            Repite la nueva clave
            <input
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-md border border-line px-3 outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/15"
              onChange={(event) => setConfirmation(event.target.value)}
              type="password"
              value={confirmation}
            />
          </label>
          <p className="rounded-md bg-panel-secondary p-3 text-xs leading-5 text-ink-muted">
            Usa de 12 a 128 caracteres e incluye mayúsculas, minúsculas,
            números y al menos un símbolo.
          </p>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Confirmando…" : "Guardar clave y continuar"}
          </Button>
        </form>
        <form action={salir} className="border-t border-line p-4 text-center">
          <button
            className="min-h-10 text-xs font-extrabold text-ink-muted underline underline-offset-4"
            type="submit"
          >
            Cerrar sesión
          </button>
        </form>
      </Card>
    </main>
  );
}
