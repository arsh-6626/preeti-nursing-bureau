import type { Metadata } from "next";
import { requireActorPage } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/domain/labels";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/ui/panel";
import { ChangePasswordForm } from "@/components/admin/user-forms";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const actor = await requireActorPage();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Your account" description={`${actor.name} · ${actor.email} · ${ROLE_LABELS[actor.role]}`} />
      <Panel title="Change password"><ChangePasswordForm /></Panel>
    </div>
  );
}
