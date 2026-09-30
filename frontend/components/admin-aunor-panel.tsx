"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getAunorWorkspaceAction } from "@/app/aunor/actions";
import { saveAdminActivityAction } from "@/app/aunor/admin-management-actions";
import {
  type AdminActivityInput,
  previewContractRelation,
} from "@/lib/admin-activity-management";
import { type AunorWorkspace, type AunorActivityRow } from "@/lib/aunor";
import type { SimulatedActivity } from "@/lib/activity-simulation";
import type { Role } from "@/lib/roles";
import { periodLabel } from "@/lib/contract-progress";
import { safeMaterialUrl } from "@/lib/external-link";
import { AdminContractPeriod } from "./admin-contract-period";
import { AdminAunorAdvanced } from "./admin-aunor-advanced";
import { AgreementList, ReplacementSummary } from "./aunor-space";
import { Button } from "./button";
import { SystemIcon } from "./system-icon";
import s from "./admin-aunor-panel.module.css";

type Props = {
  item: SimulatedActivity;
  role: Role;
  onAssigned?: (item: SimulatedActivity | null) => void;
};
export function AdminAunorPanel(props: Props) {
  if (
    props.role.id !== "admin" ||
    props.item.origin === "burson" ||
    props.item.deletedAt
  )
    return null;
  return <CompactManagement key={props.item.id} {...props} />;
}
function CompactManagement({ item, role, onAssigned }: Props) {
  const [w, setW] = useState<AunorWorkspace | null>(null);
  const [draft, setDraft] = useState({
    service: "",
    period: "",
    summary: "",
    reason: "",
    version: 0,
  });
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pending, transition] = useTransition();
  const [advanced, setAdvanced] = useState(false);
  const requests = useRef(new Map<string, string>()),
    initialized = useRef(false);
  const accept = useCallback((a: AunorActivityRow | undefined) => {
    setDraft({
      service: a?.service_id ?? "",
      period: a?.contract_period_id ?? "",
      summary: a?.summary || "",
      reason: a?.not_performed_reason ?? "",
      version: a?.publication_version ?? 0,
    });
  }, []);
  const load = useCallback(async () => {
    try {
      const result = await getAunorWorkspaceAction();
      if (!result.ok) {
        setError(result.error);
        return null;
      }
      setW(result.data);
      if (!initialized.current) {
        accept(result.data.activities.find((a) => a.id === item.id));
        initialized.current = true;
      }
      return result.data;
    } catch {
      setError("No se pudo cargar el contrato. Reintenta para continuar.");
      return null;
    }
  }, [accept, item.id]);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [load]);
  const published = w?.activities.find((a) => a.id === item.id);
  const conflict = Boolean(
    published && published.publication_version !== draft.version,
  );
  const periods =
    w?.contractPeriods
      ?.filter((p) => p.service_id === draft.service)
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on)) ?? [];
  const preview = w
    ? previewContractRelation(
        w,
        item.id,
        draft.service,
        draft.period,
        draft.summary,
      )
    : null;
  const [original, setOriginal] = useState(""),
    [agreement, setAgreement] = useState(""),
    [reason, setReason] = useState("");
  const [requester, setRequester] = useState(""),
    [contact, setContact] = useState(""),
    [channel, setChannel] = useState("Llamada"),
    [evidence, setEvidence] = useState("");
  const replacementDetails = useRef<HTMLDetailsElement>(null),
    replacementSummary = useRef<HTMLElement>(null);
  const replacements =
    w?.replacements.filter(
      (r) =>
        r.original_activity_id === item.id ||
        r.substitute_activity_id === item.id,
    ) ?? [];
  const currentReplacements = replacements.filter((r) => r.is_current);
  const agreements =
    w?.agreements.filter(
      (g) => g.is_current && [original, item.id].includes(g.activity_id),
    ) ?? [];
  async function save(
    input:
      | Omit<Extract<AdminActivityInput, { command: "relation" }>, "requestId">
      | Omit<
          Extract<AdminActivityInput, { command: "replacement" }>,
          "requestId"
        >,
  ) {
    const key = JSON.stringify(input),
      requestId = requests.current.get(key) ?? crypto.randomUUID();
    requests.current.set(key, requestId);
    setError("");
    setNotice("");
    try {
      const result = await saveAdminActivityAction(
        { ...input, requestId },
        item,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      requests.current.delete(key);
      onAssigned?.(result.activity);
      setNotice(
        input.command === "relation"
          ? "Relación contractual guardada. El estado de la actividad no cambia."
          : "Reemplazo y acuerdo registrados. Ambas actividades se conservan.",
      );
      const fresh = await load();
      if (fresh) accept(fresh.activities.find((a) => a.id === item.id));
      if (input.command === "replacement") {
        if (replacementDetails.current) replacementDetails.current.open = false;
        replacementSummary.current?.focus();
        setOriginal("");
        setAgreement("");
        setReason("");
        setRequester("");
        setContact("");
        setEvidence("");
      }
    } catch {
      setError(
        "No se pudo confirmar el guardado. Reintenta con los mismos campos para evitar duplicados.",
      );
    }
  }
  return (
    <section aria-label="Gestión Aunor" className={s.panel} aria-busy={pending}>
      <header className={s.heading}>
        <div>
          <h2 className="section-title text-2xl">Relación con el contrato</h2>
          <p>Elige el servicio y confirma el periodo en un solo paso.</p>
        </div>
        <small className="data-label">Cliente Aunor</small>
      </header>
      {error && (
        <div role="alert" className={`${s.feedback} ${s.error}`}>
          {error}{" "}
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Recargar información
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className={s.feedback}>
          {notice}
        </p>
      )}
      {conflict && (
        <div role="status" className={`${s.feedback} ${s.conflict}`}>
          <p>Hay una publicación más reciente. Tu borrador se conserva.</p>
          <Button variant="secondary" onClick={() => accept(published)}>
            Cargar versión vigente
          </Button>
        </div>
      )}
      {!w ? (
        <p role="status">Cargando relación contractual…</p>
      ) : (
        <>
          <div className={s.card}>
            <div className={s.grid}>
              <form
                className={s.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  transition(() =>
                    save({
                      command: "relation",
                      activityId: item.id,
                      activityVersion: item.version,
                      publicationVersion: draft.version,
                      serviceId: draft.service,
                      periodId: draft.period || null,
                      summary:
                        draft.summary.trim() ||
                        item.description.trim() ||
                        item.title,
                      notPerformedReason: draft.reason,
                      confirmed: true,
                    }),
                  );
                }}
              >
                <fieldset
                  disabled={pending || conflict}
                  className="min-w-0 border-0 p-0"
                >
                  <div className={s.fields}>
                    <label className={s.label}>
                      Servicio del contrato
                      <select
                        className={s.input}
                        value={draft.service}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            service: e.target.value,
                            period: "",
                          })
                        }
                      >
                        <option value="">Por relacionar</option>
                        {w.services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={s.label}>
                      Periodo contractual
                      <select
                        className={s.input}
                        value={draft.period}
                        disabled={!draft.service}
                        onChange={(e) =>
                          setDraft({ ...draft, period: e.target.value })
                        }
                      >
                        <option value="">Por confirmar</option>
                        {periods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {periodLabel(period)} ·{" "}
                            {period.target === null
                              ? "Meta por confirmar"
                              : `${period.target} trabajos`}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className={s.help}>
                    {draft.period
                      ? "Al guardar confirmas que este es el periodo contractual correcto."
                      : "Sin un periodo confirmado, esta actividad no suma al contrato."}{" "}
                    Solo cuentan actividades entregadas, no sustituidas y
                    realizadas.
                  </p>
                  {draft.service && !periods.length && (
                    <p className={s.help}>
                      Este servicio aún no tiene periodos configurados.
                      Prepáralos en «Configurar periodos y metas».
                    </p>
                  )}
                  <div className={s.save}>
                    <span className={s.saved}>
                      <SystemIcon name="calendar" className="size-4" />
                      {published?.contract_period_id
                        ? "Periodo guardado: " +
                          (w.contractPeriods?.find(
                            (p) => p.id === published.contract_period_id,
                          )
                            ? periodLabel(
                                w.contractPeriods!.find(
                                  (p) => p.id === published.contract_period_id,
                                )!,
                              )
                            : "por revisar")
                        : "Periodo pendiente de confirmar"}
                    </span>
                    <Button type="submit" disabled={pending || conflict}>
                      {pending ? "Guardando…" : "Guardar relación"}
                      <SystemIcon name="check" className="ml-2 size-4" />
                    </Button>
                  </div>
                </fieldset>
              </form>
              <aside className={s.preview} aria-label="Vista previa del conteo">
                <p className="data-label text-cyan-ink">
                  Vista previa del conteo
                </p>
                {preview ? (
                  <>
                    <strong>{periodLabel(preview.label)}</strong>
                    <div className={s.numbers}>
                      <span>
                        {preview.before}
                        <small>/{preview.target ?? "—"}</small>
                      </span>
                      <SystemIcon name="arrow-right" className="size-5" />
                      <span>
                        {preview.after}
                        <small>/{preview.target ?? "—"}</small>
                      </span>
                    </div>
                    {preview.target !== null && (
                      <div className={s.bar} aria-hidden="true">
                        <span
                          style={{
                            width: `${Math.min(100, (preview.after / preview.target) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <p className={s.help}>
                      {preview.delta > 0
                        ? `Al guardar: +${preview.delta} trabajo.`
                        : "Esta selección no añade trabajos al conteo."}{" "}
                      El conteo aún no cambia.
                      {preview.target === null ? " Meta por confirmar." : ""}
                    </p>
                  </>
                ) : (
                  <p className={s.help}>
                    Selecciona un periodo para ver cómo quedaría su conteo. No
                    se asigna por la fecha de la actividad.
                  </p>
                )}
              </aside>
            </div>
            <details className={s.disclosure}>
              <summary>Personalizar resumen para Aunor · opcional</summary>
              <label className={s.label}>
                Resumen para Aunor
                <textarea
                  className={s.input}
                  rows={3}
                  maxLength={5000}
                  disabled={pending || conflict}
                  value={draft.summary}
                  onChange={(e) =>
                    setDraft({ ...draft, summary: e.target.value })
                  }
                />
              </label>
              <p className={s.help}>
                Se guarda con «Guardar relación». No incluyas opiniones ni notas
                internas.
              </p>
            </details>
          </div>
          <div className={s.rows}>
            <details className={s.row} ref={replacementDetails}>
              <summary ref={replacementSummary}>
                <span className={s.icon}>
                  <SystemIcon name="swap" className="size-5" />
                </span>
                <span>
                  <strong>Reemplazo</strong>
                  <small>
                    {currentReplacements.length
                      ? "Esta actividad tiene una relación de reemplazo. Consulta el historial."
                      : "Esta actividad no tiene un reemplazo registrado."}
                  </small>
                </span>
                <em>Registrar reemplazo →</em>
              </summary>
              <form
                className={s.body}
                onSubmit={(e) => {
                  e.preventDefault();
                  transition(() =>
                    save({
                      command: "replacement",
                      activityId: item.id,
                      activityVersion: item.version,
                      originalId: original,
                      agreementId: agreement,
                      reason,
                      channel,
                      contactedAt: contact
                        ? new Date(contact).toISOString()
                        : "",
                      requesterDeclared: requester,
                      evidenceLink: evidence,
                    }),
                  );
                }}
              >
                <h3 className="section-title text-xl">
                  Esta actividad reemplaza a…
                </h3>
                <div className={s.fixed}>
                  <span className={s.help}>
                    Actividad sustituta · ficha actual
                  </span>
                  <strong>{item.title}</strong>
                </div>
                <fieldset
                  disabled={pending}
                  className={`${s.fields} min-w-0 border-0 p-0`}
                >
                  <label className={`${s.label} ${s.full}`}>
                    Actividad original
                    <select
                      className={s.input}
                      required
                      value={original}
                      onChange={(e) => {
                        setOriginal(e.target.value);
                        setAgreement("");
                      }}
                    >
                      <option value="">Selecciona la actividad original</option>
                      {w.activities
                        .filter(
                          (a) =>
                            a.id !== item.id &&
                            !w.replacements.some(
                              (r) =>
                                r.is_current && r.original_activity_id === a.id,
                            ),
                        )
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ·{" "}
                            {w.journeys.find((j) => j.activity_id === a.id)
                              ?.start_date ?? a.id.slice(-6)}
                          </option>
                        ))}
                    </select>
                  </label>
                  {agreements.length > 0 && (
                    <label className={`${s.label} ${s.full}`}>
                      Acuerdo de respaldo
                      <select
                        className={s.input}
                        value={agreement}
                        onChange={(e) => setAgreement(e.target.value)}
                      >
                        <option value="">Registrar un nuevo acuerdo</option>
                        {agreements.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.channel} · {g.body.slice(0, 100)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className={`${s.label} ${s.full}`}>
                    Motivo y acuerdo registrado
                    <textarea
                      className={s.input}
                      required
                      minLength={2}
                      maxLength={3000}
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe por qué cambió el trabajo y qué se acordó."
                    />
                  </label>
                  {!agreement && (
                    <>
                      <label className={s.label}>
                        Solicitado por
                        <input
                          className={s.input}
                          required
                          minLength={2}
                          maxLength={180}
                          value={requester}
                          onChange={(e) => setRequester(e.target.value)}
                        />
                      </label>
                      <label className={s.label}>
                        Fecha del acuerdo
                        <input
                          className={s.input}
                          required
                          type="datetime-local"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                        />
                      </label>
                      <label className={s.label}>
                        Canal del acuerdo
                        <select
                          className={s.input}
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                        >
                          <option>Llamada</option>
                          <option>Reunión</option>
                          <option>Acuerdo verbal</option>
                        </select>
                      </label>
                    </>
                  )}
                  <label className={s.label}>
                    Enlace de respaldo · opcional
                    <input
                      className={s.input}
                      type="url"
                      placeholder="https://"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                    />
                  </label>
                </fieldset>
                <p className={s.help}>
                  Se conservan ambas actividades. La original queda identificada
                  como sustituida y no se cuenta dos veces. Admin registra; no
                  representa aprobación del cliente.
                </p>
                <div className={s.save}>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (replacementDetails.current)
                        replacementDetails.current.open = false;
                      replacementSummary.current?.focus();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={pending || !original}>
                    Registrar reemplazo
                  </Button>
                </div>
              </form>
            </details>
            <details className={s.row}>
              <summary>
                <span className={s.icon}>
                  <SystemIcon name="history" className="size-5" />
                </span>
                <span>
                  <strong>Historial y respaldos</strong>
                  <small>
                    Versiones del material, acuerdos y reemplazos conservados.
                  </small>
                </span>
                <em>Ver historial →</em>
              </summary>
              <div className={`${s.body} ${s.history}`}>
                <AgreementList w={w} id={item.id} />
                {replacements.map((r) => (
                  <article key={r.id} className={s.history}>
                    <ReplacementSummary r={r} w={w} admin />
                    <p>
                      <strong>Motivo:</strong> {r.reason}
                    </p>
                    <p>
                      <strong>Respaldo:</strong> {r.evidence_note}
                    </p>
                    {safeMaterialUrl(r.evidence_link) && (
                      <a
                        href={safeMaterialUrl(r.evidence_link)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir respaldo del reemplazo ↗
                      </a>
                    )}
                    {w.agreements.find((g) => g.id === r.agreement_id)
                      ?.activity_id !== item.id && (
                      <AgreementList
                        w={{
                          ...w,
                          agreements: w.agreements.filter(
                            (g) => g.id === r.agreement_id,
                          ),
                        }}
                        id={
                          w.agreements.find((g) => g.id === r.agreement_id)
                            ?.activity_id ?? ""
                        }
                      />
                    )}
                  </article>
                ))}
                <h3 className="section-title text-xl">
                  Versiones del material
                </h3>
                <ul>
                  {w.deliveries
                    .filter((d) => d.activity_id === item.id)
                    .map((d) => (
                      <li key={d.id}>
                        <strong>
                          {d.label} · v{d.version}
                        </strong>
                        <p>
                          {d.is_current
                            ? "Versión vigente"
                            : "Versión anterior"}
                        </p>
                        {safeMaterialUrl(d.material_link) && (
                          <a
                            href={safeMaterialUrl(d.material_link)!}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir material ↗
                          </a>
                        )}
                      </li>
                    ))}
                </ul>
                {!w.deliveries.some((d) => d.activity_id === item.id) && (
                  <p className={s.help}>
                    No hay versiones adicionales registradas. El material actual
                    sigue disponible en la ficha.
                  </p>
                )}
              </div>
            </details>
          </div>
          <AdminContractPeriod
            key={draft.service}
            w={w}
            activityId={item.id}
            activityVersion={item.version}
            onRefresh={load}
            onAssigned={(a) => onAssigned?.(a)}
            configOnly
            serviceOverride={draft.service}
          />
          <details
            className={s.advanced}
            onToggle={(e) => {
              setAdvanced(e.currentTarget.open);
              if (!e.currentTarget.open) void load();
            }}
          >
            <summary>
              Más opciones · versiones, trabajos no realizados y correcciones
            </summary>
            {advanced && (
              <AdminAunorAdvanced
                item={item}
                role={role}
                onAssigned={onAssigned}
              />
            )}
          </details>
          <p className={s.help}>
            Aunor consulta; Admin gestiona. Relacionar un trabajo no cambia su
            estado ni aprueba pagos.
          </p>
        </>
      )}
    </section>
  );
}
