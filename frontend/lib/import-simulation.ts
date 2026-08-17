export const importSimulation = {
  fileName: "historico-ejemplo.xlsx",
  accepted: [
    { row: 2, date: "12/07/2026", title: "Registro de mantenimiento preventivo", place: "Panamericana Norte" },
    { row: 3, date: "19/07/2026", title: "Cobertura de señalización vial", place: "Peaje Chillón" },
    { row: 5, date: "28/07/2026", title: "Resumen audiovisual de intervención", place: "Sin ubicación" },
  ],
  rejected: [
    { row: 4, summary: "Actividad sin título", reason: "El título está vacío." },
    { row: 6, summary: "Fecha: 42/07/2026", reason: "La fecha no tiene un formato válido." },
  ],
} as const;
