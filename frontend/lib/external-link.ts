const allowedOneDriveHosts = ["onedrive.live.com", "1drv.ms"];

export function safeMaterialUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const allowedHost = allowedOneDriveHosts.includes(url.hostname) || url.hostname.endsWith(".sharepoint.com");
    return url.protocol === "https:" && allowedHost ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeReferenceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
