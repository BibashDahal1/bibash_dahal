export interface VisitorPayload {
  name: string;
  gender: "male" | "female" | "other";
  isCompany: boolean;
  company?: string;
  device: "mobile" | "desktop";
}

/** Saves a visitor in the background. Never throws and never makes the visitor wait. */
export function saveVisitor(payload: VisitorPayload) {
  try {
    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // still goes through if the page is busy changing
    }).catch(() => undefined);
  } catch {
    /* saving is best-effort */
  }
}
