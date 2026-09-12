// Legacy Supabase views expose this organizational label, not a person's name.
// Normalize only its presentation; never rewrite messages or historical data.
export function displayOrganizationAuthor(value: string): string {
  return value === "Admin · Rhino" ? "Admin · DaVinci" : value;
}
