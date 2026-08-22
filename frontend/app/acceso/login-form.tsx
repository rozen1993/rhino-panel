"use client";

import { useActionState } from "react";
import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { entrar } from "@/app/acceso/actions";

export function LoginForm({ initialUser = "" }: { initialUser?: string }) {
  const [error, action, pending] = useActionState(entrar, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormField
        autoComplete="username"
        defaultValue={initialUser}
        id="usuario"
        label="Usuario"
        name="usuario"
        placeholder="Tu usuario"
        required
      />
      <FormField
        autoComplete="current-password"
        id="clave"
        label="Clave"
        name="clave"
        placeholder="Tu clave"
        required
        type="password"
      />
      {error && (
        <p
          aria-live="polite"
          className="rounded-[5px] border border-red bg-red/5 px-3 py-2 text-sm font-semibold text-red"
        >
          {error}
        </p>
      )}
      <p className="text-right text-xs text-ink-muted">
        Si olvidaste tu clave, solicítala al administrador.
      </p>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
