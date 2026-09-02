type FunctionErrorPayload = {
  code?: string;
  message?: string;
};

function payload(value: unknown): FunctionErrorPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message:
      typeof candidate.message === "string" ? candidate.message : undefined,
  };
}

export async function functionErrorMessage(
  error: unknown,
  messages: Record<string, string>,
  fallback: string,
) {
  if (!error || typeof error !== "object") return fallback;
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      const detail = payload(await context.clone().json());
      if (detail?.code && messages[detail.code]) return messages[detail.code];
      if (detail?.message) return detail.message;
    } catch {
      // La respuesta puede no ser JSON; en ese caso se usa un mensaje seguro.
    }
  }
  return fallback;
}
