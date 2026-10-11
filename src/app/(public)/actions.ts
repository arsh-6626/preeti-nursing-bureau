"use server";

import { ZodError } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { clientFingerprint } from "@/lib/request-context";
import { submitPublicRequest, type SubmitResult } from "@/lib/services/requests";
import { createContactInquiry } from "@/lib/services/inquiries";
import { failure, formToObject, success, type ActionState } from "@/lib/actions/state";

const REQUEST_LIMIT = 8; // per hour per client
const INQUIRY_LIMIT = 5;

export async function submitCareRequestAction(payload: unknown): Promise<SubmitResult> {
  const fp = await clientFingerprint();
  if (!(await rateLimit(`request:${fp}`, REQUEST_LIMIT, 3_600_000))) {
    return { ok: false, error: "Too many requests from this connection. Please call or WhatsApp us instead, or try again in an hour." };
  }
  try {
    return await submitPublicRequest(payload);
  } catch (error) {
    console.error("[request] submission failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "We could not save your request just now. Your answers are still here; please try again." };
  }
}

export async function submitContactInquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fp = await clientFingerprint();
  if (!(await rateLimit(`inquiry:${fp}`, INQUIRY_LIMIT, 3_600_000))) {
    return failure("Too many messages from this connection. Please call or WhatsApp us instead.");
  }
  try {
    await createContactInquiry(formToObject(formData));
    return success("Thank you. We will call you back during business hours.");
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) fieldErrors[issue.path.join(".") || "form"] ??= issue.message;
      return failure("Please check the highlighted fields.", fieldErrors);
    }
    console.error("[inquiry] failed", error instanceof Error ? error.message : "unknown");
    return failure("We could not send your message. Please try again or call us.");
  }
}
