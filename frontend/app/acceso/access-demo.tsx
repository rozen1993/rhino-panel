"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/app/acceso/login-form";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { SystemIcon } from "@/components/system-icon";
import { useAccounts } from "@/lib/account-store";
import {
  canViewActivity,
  useSimulatedActivities,
} from "@/lib/activity-simulation";
import type { Account } from "@/lib/accounts";
import { roles } from "@/lib/roles";

const limaDate = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function AccessDialog({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = window.requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLInputElement>("#clave")?.focus(),
    );
    return () => {
      window.cancelAnimationFrame(frame);
      previous?.focus();
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      panel.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="access-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="access-dialog-title"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        ref={panel}
        role="dialog"
      >
        <Card className="relative w-[min(25.5rem,calc(100vw-1.5rem))] p-5 text-ink shadow-[var(--shadow-3)] sm:p-6">
          <button
            aria-label="Cerrar acceso"
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-line bg-white text-lg text-ink-muted transition hover:border-cyan hover:text-ink"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full border-[5px] border-cyan/10 bg-gradient-to-br from-cyan to-[#078ca2] text-white shadow-[0_7px_18px_rgba(0,142,164,.24)]">
              <SystemIcon
                className="size-7"
                name={
                  account.roleId === "burson"
                    ? "burson"
                    : account.roleId === "admin"
                      ? "accounts"
                      : "activities"
                }
              />
            </span>
            <h2 className="display-title mt-3 text-xl" id="access-dialog-title">
              Acceso de colaborador
            </h2>
            <strong className="mt-1 block text-sm">{account.name}</strong>
            <p className="text-[0.6875rem] text-ink-muted">
              {roles[account.roleId].label}
              {account.bursonLinked ? " especial · encargos Burson" : ""}
            </p>
            <p className="mt-4 text-xs text-ink-muted">
              Ingresa tu clave personal para continuar
            </p>
          </div>
          <div className="mt-5" key={account.id}>
            <LoginForm initialUser={account.username} />
          </div>
          <p className="mt-4 border-t border-line pt-4 text-center text-[0.6875rem] text-ink-muted">
            ▣ &nbsp; Acceso seguro y privado
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function AccessPage() {
  const accounts = useAccounts().filter((account) => account.active);
  const activities = useSimulatedActivities().filter(
    (activity) => !activity.deletedAt,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = accounts.find((account) => account.id === selectedId);

  return (
    <main className="technical-surface relative min-h-screen overflow-x-hidden px-3 py-5 text-white sm:px-6 lg:px-10 lg:py-7">
      <Link
        className="relative z-10 inline-flex min-h-10 items-center gap-2 text-xs text-white/80 transition hover:text-cyan"
        href="/"
      >
        <span className="grid size-7 place-items-center rounded-full border border-white/20">
          ▣
        </span>
        <span>Acceso mediante contraseña</span>
      </Link>
      <header className="relative z-10 mx-auto mt-5 max-w-4xl text-center lg:mt-4">
        <h1 className="brand-condensed text-[2.45rem] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,.65)] sm:text-5xl lg:text-[4.1rem]">
          CONTROL DE ACTIVIDADES
        </h1>
        <p className="mt-3 text-xs font-extrabold tracking-[0.25em] text-cyan sm:text-lg">
          RHINO AUDIOVISUALES
        </p>
        <span className="mx-auto mt-3 block h-[3px] w-12 bg-lime shadow-[0_0_14px_rgba(132,214,0,.5)]" />
        <p className="mt-3 text-sm text-white/70">
          Gestión integral del equipo audiovisual
        </p>
        <span className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/[.025] px-6 py-2.5 text-sm shadow-[inset_0_0_20px_rgba(17,183,201,.04)]">
          <SystemIcon className="size-4 text-cyan" name="calendar" />
          Agosto 2026
        </span>
      </header>
      <section
        aria-labelledby="test-users-title"
        className="relative z-10 mx-auto mt-6 max-w-7xl pb-8 lg:mt-5"
      >
        <h2 className="sr-only" id="test-users-title">
          Cuentas de acceso
        </h2>
        <ul className="space-y-2">
          {accounts.map((account) => {
            const role = {
              ...roles[account.roleId],
              accountId: account.id,
              accountName: account.name,
              bursonLinked: account.bursonLinked,
            };
            const count = activities.filter((activity) =>
              canViewActivity(activity, role),
            ).length;
            return (
              <li key={account.id}>
                <Card className="grid min-h-[4.8rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-ink transition duration-200 hover:-translate-y-px hover:border-cyan/50 hover:shadow-[var(--shadow-2)] lg:grid-cols-[minmax(16rem,1.25fr)_9rem_8rem_14rem_8.5rem]">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar initials={account.initials} />
                    <span className="min-w-0">
                      <strong className="display-title block truncate text-base">
                        {account.name}
                      </strong>
                      <small className="block truncate text-ink-muted">
                        {roles[account.roleId].label}
                        {account.bursonLinked
                          ? " especial · encargos Burson"
                          : ""}
                      </small>
                    </span>
                  </div>
                  <span className="hidden items-center gap-2 rounded-lg bg-green/10 px-3 py-2 text-xs font-bold text-green lg:flex">
                    <i className="size-2 rounded-full bg-green" />
                    Activo
                  </span>
                  <span className="hidden border-l border-line pl-4 lg:block">
                    <b className="display-title block text-xl tabular-nums">
                      {count}
                    </b>
                    <small className="text-[0.625rem] text-ink-muted">
                      actividades
                    </small>
                  </span>
                  <span className="hidden border-l border-line pl-4 text-[0.625rem] text-ink-muted lg:block">
                    ◷ &nbsp; Última actualización
                    <br />
                    <b className="font-mono font-normal">
                      {limaDate
                        .format(new Date(account.updatedAt))
                        .replace(",", " ·")}
                    </b>
                  </span>
                  <button
                    className="action-surface min-h-10 rounded-md px-4 text-xs font-extrabold text-[#173000] shadow-[0_6px_14px_rgba(95,170,0,.2)]"
                    onClick={() => setSelectedId(account.id)}
                    type="button"
                  >
                    Ingresar&nbsp; ›
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
      {selected && (
        <AccessDialog account={selected} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
