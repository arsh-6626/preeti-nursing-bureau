import { ZodError } from "zod";
import { AuthorizationError, DomainError, NotFoundError } from "@/lib/auth/permissions";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every result so forms can react to repeated identical results. */
  at?: number;
} | null;

export function success(message?: string): ActionState {
  return { ok: true, message, at: Date.now() };
}

export function failure(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, message, fieldErrors, at: Date.now() };
}

/** Converts known errors into user-safe messages; unknown errors are logged and hidden. */
export function toActionState(error: unknown): ActionState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) fieldErrors[issue.path.join(".") || "form"] ??= issue.message;
    return failure("Please check the highlighted fields.", fieldErrors);
  }
  if (error instanceof DomainError || error instanceof AuthorizationError || error instanceof NotFoundError) {
    return failure(error.message);
  }
  // Re-throw Next.js control-flow errors (redirect / notFound).
  if (error && typeof error === "object" && "digest" in error && typeof (error as { digest: unknown }).digest === "string" && (error as { digest: string }).digest.startsWith("NEXT_")) {
    throw error;
  }
  console.error("[action] unexpected error", error instanceof Error ? error.message : error);
  return failure("Something went wrong. Please try again.");
}

/** Reads FormData into a plain object. Keys listed in `arrays` keep every value. */
export function formToObject(formData: FormData, arrays: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    if (arrays.includes(key)) out[key] = formData.getAll(key).map(String);
    else out[key] = String(formData.get(key) ?? "");
  }
  for (const key of arrays) out[key] ??= [];
  return out;
}
