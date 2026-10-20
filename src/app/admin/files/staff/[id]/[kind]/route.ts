import { currentActor } from "@/lib/auth/dal";
import { AuthorizationError, NotFoundError } from "@/lib/auth/permissions";
import { getStaffFile, type StaffFileKind } from "@/lib/services/caregivers";

const KINDS: Record<string, StaffFileKind> = { photo: "PHOTO", aadhaar: "AADHAAR" };

/** Serves a staff photo or Aadhaar image to signed-in users with the right permission. Never cached. */
export async function GET(_req: Request, { params }: RouteContext<"/admin/files/staff/[id]/[kind]">) {
  const { id, kind } = await params;
  const fileKind = KINDS[kind];
  if (!fileKind || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const actor = await currentActor();
  if (!actor) return new Response("Sign in required", { status: 401 });
  try {
    const file = await getStaffFile(actor, id, fileKind);
    return new Response(Buffer.from(file.data), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response("Forbidden", { status: 403 });
    if (e instanceof NotFoundError) return new Response("Not found", { status: 404 });
    throw e;
  }
}
