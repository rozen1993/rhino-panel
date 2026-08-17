export type Account = {
  name: "Johann" | "Eduardo" | "Chiara" | "Martín";
  initials: string;
  roles: readonly string[];
  active: boolean;
};

export const accounts: readonly Account[] = [
  { name: "Johann", initials: "JV", roles: [], active: true },
  { name: "Eduardo", initials: "EV", roles: [], active: true },
  { name: "Chiara", initials: "CH", roles: [], active: true },
  { name: "Martín", initials: "MV", roles: ["Supervisión"], active: true },
] as const;
