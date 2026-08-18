/**
 * Catálogo de roles del sistema.
 *
 * El sistema modela ROLES, no personas (D-001, D-047). Marco asigna qué persona
 * ocupa cada rol; el código solo conoce los roles y lo que cada uno puede hacer.
 *
 * Cada rol actúa estrictamente dentro de lo que su rol permite (D-045).
 */

export const roleIds = [
  "grabacion",
  "edicion",
  "coordinacion",
  "creatividad",
  "locucion",
  "supervision",
  "aunor",
  "burson",
] as const;

export type RoleId = (typeof roleIds)[number];

/** Los tipos de actividad, homónimos de los cinco roles de trabajo (D-045). */
export const activityTypes = ["Grabación", "Edición", "Coordinación", "Creatividad", "Locución"] as const;
export type ActivityType = (typeof activityTypes)[number];

export type Role = {
  id: RoleId;
  label: string;
  /** trabajo: registra actividades · gobierno: supervisa · externo: no es de Rhino */
  kind: "trabajo" | "gobierno" | "externo";
  /** Qué tipo de actividad registra, si es un rol de trabajo (D-045). */
  activityType?: ActivityType;
  /** Ve las actividades de todo el equipo, no solo las suyas (D-003, D-016). */
  seesAllActivities: boolean;
  /** Puede observar, aprobar, resolver y cancelar (D-009, D-015). */
  supervises: boolean;
  /** Ve el tablero de Burson (D-011). */
  seesBurson: boolean;
  /** Administra cuentas (D-001). */
  administers: boolean;
  /** Vive fuera de la interfaz interna de Rhino (D-004, D-051). */
  externalView?: "aunor" | "burson";
  /** Qué ve y qué no, en una línea, para la pantalla de prueba. */
  summary: string;
};

export const roles: Record<RoleId, Role> = {
  grabacion: {
    id: "grabacion",
    label: "Grabación",
    kind: "trabajo",
    activityType: "Grabación",
    seesAllActivities: false,
    supervises: false,
    seesBurson: false,
    administers: false,
    summary: "Registra coberturas desde el campo. Ve solo las suyas. La ubicación es obligatoria.",
  },
  edicion: {
    id: "edicion",
    label: "Edición",
    kind: "trabajo",
    activityType: "Edición",
    seesAllActivities: false,
    supervises: false,
    seesBurson: false,
    administers: false,
    summary: "Mueve el avance de postproducción y deja el enlace al material. Ve solo las suyas.",
  },
  coordinacion: {
    id: "coordinacion",
    label: "Coordinación",
    kind: "trabajo",
    activityType: "Coordinación",
    seesAllActivities: true,
    supervises: false,
    seesBurson: true,
    administers: false,
    summary: "Ve las actividades de todo el equipo y mantiene el tablero de Burson, pero no observa ni aprueba.",
  },
  creatividad: {
    id: "creatividad",
    label: "Creatividad",
    kind: "trabajo",
    activityType: "Creatividad",
    seesAllActivities: false,
    supervises: false,
    seesBurson: false,
    administers: false,
    summary: "Registra producción y desarrollo creativo. Ve solo las suyas.",
  },
  locucion: {
    id: "locucion",
    label: "Locución",
    kind: "trabajo",
    activityType: "Locución",
    seesAllActivities: false,
    supervises: false,
    seesBurson: false,
    administers: false,
    summary: "Registra locuciones. Ve solo las suyas. Rol estándar, como los otros de trabajo.",
  },
  supervision: {
    id: "supervision",
    label: "Supervisión / Administración",
    kind: "gobierno",
    seesAllActivities: true,
    supervises: true,
    seesBurson: true,
    administers: true,
    summary: "Ve todo, observa, resuelve, aprueba y cancela. Administra cuentas. No registra trabajo de campo.",
  },
  aunor: {
    id: "aunor",
    label: "AUNOR",
    kind: "externo",
    externalView: "aunor",
    seesAllActivities: false,
    supervises: false,
    seesBurson: false,
    administers: false,
    summary: "Consulta el mes en su propia interfaz y deja su opinión. Nunca ve nada interno.",
  },
  burson: {
    id: "burson",
    label: "Burson",
    kind: "externo",
    externalView: "burson",
    seesAllActivities: false,
    supervises: false,
    seesBurson: true,
    administers: false,
    summary: "Rol externo nuevo (D-051). Qué ve exactamente está SIN DECIDIR: ver D-052.",
  },
};

export const roleList: readonly Role[] = roleIds.map((id) => roles[id]);

/** El tipo de actividad que este rol puede registrar (D-045). Vacío si no es de trabajo. */
export function allowedActivityTypes(role: Role): readonly ActivityType[] {
  return role.activityType ? [role.activityType] : [];
}
