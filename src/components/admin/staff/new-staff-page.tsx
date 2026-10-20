import { can, type Actor } from "@/lib/auth/permissions";
import { STAFF, type StaffKind } from "@/lib/domain/staff";
import { PageHeader } from "@/components/admin/page-header";
import { CaregiverForm } from "@/components/admin/caregiver-form";
import { Notice } from "@/components/ui/panel";
import { staffFormOptions } from "./staff-form-options";

export async function NewStaffPage({ kind, actor }: { kind: StaffKind; actor: Actor }) {
  const meta = STAFF[kind];
  const options = await staffFormOptions(actor, kind);
  return (
    <div className="max-w-3xl">
      <PageHeader title={`Add ${meta.label.toLowerCase()}`} back={{ href: meta.listPath, label: meta.plural }} />
      <div className="mb-6"><Notice tone="info">New profiles start as “Not started” for verification. Record checks on the profile after saving.</Notice></div>
      <CaregiverForm
        kind={kind}
        defaults={{ supportedShifts: [] }}
        {...options}
        showPay={can(actor, "caregiver:compensation")}
        showAadhaar={can(actor, "caregiver:verification")}
      />
    </div>
  );
}
