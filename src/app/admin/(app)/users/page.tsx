import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/dal";
import { listUsers } from "@/lib/services/users";
import { ROLE_LABELS } from "@/lib/domain/labels";
import { formatDateTime } from "@/lib/domain/dates";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Td, Th } from "@/components/ui/table";
import { InlineAction } from "@/components/admin/inline-action";
import { CreateUserForm, ResetPasswordForm } from "@/components/admin/user-forms";
import { setUserActiveAction } from "@/app/admin/actions/settings";

export const metadata: Metadata = { title: "Team" };

export default async function UsersPage() {
  const actor = await requirePermissionPage("users:manage");
  const users = await listUsers(actor);
  return (
    <>
      <PageHeader title="Team" description="Who can sign in to the admin. Staff see only leads assigned to them and never see finances or settings." />
      <div className="mb-6">
        <TableWrap caption="Team members">
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Status</Th><Th>Last sign-in</Th><Th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td><span className="font-semibold text-navy-900">{u.name}</span><div className="text-xs text-muted">{u.email}</div></Td>
                <Td>{ROLE_LABELS[u.role]}</Td>
                <Td>{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Deactivated</Badge>}</Td>
                <Td className="whitespace-nowrap">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</Td>
                <Td>
                  {u.id !== actor.id && (
                    <div className="flex flex-col items-start gap-2">
                      <InlineAction
                        action={setUserActiveAction}
                        fields={{ userId: u.id, active: u.isActive ? "0" : "1" }}
                        label={u.isActive ? "Deactivate" : "Reactivate"}
                        variant={u.isActive ? "danger" : "secondary"}
                        confirm={u.isActive ? { title: `Deactivate ${u.name}?`, body: "They are signed out immediately and cannot sign in. Their history is kept.", confirmLabel: "Deactivate" } : undefined}
                      />
                      <ResetPasswordForm userId={u.id} />
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
      <Panel title="Add a team member"><CreateUserForm /></Panel>
    </>
  );
}
