"use client";

import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { createUserAction, resetPasswordAction } from "@/app/admin/actions/settings";
import { changeOwnPasswordAction } from "@/app/admin/actions/auth";

export function CreateUserForm() {
  return (
    <ActionForm action={createUserAction} className="grid gap-4 sm:grid-cols-2" resetOnSuccess>
      <TextField name="name" label="Name" required />
      <TextField name="email" label="Email" type="email" required autoComplete="off" />
      <SelectField name="role" label="Role" required defaultValue="STAFF" options={[{ value: "STAFF", label: "Staff (assigned leads, no finance or settings)" }, { value: "ADMIN", label: "Administrator (full access)" }]} />
      <TextField name="password" label="Temporary password" type="password" required autoComplete="new-password" hint="At least 12 characters with letters and a number" />
      <div className="sm:col-span-2"><SubmitButton>Create account</SubmitButton></div>
    </ActionForm>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none font-medium text-teal-700 hover:underline [&::-webkit-details-marker]:hidden">Reset password</summary>
      <ActionForm action={resetPasswordAction} className="mt-2 flex flex-wrap items-end gap-2" resetOnSuccess>
        <input type="hidden" name="userId" value={userId} />
        <TextField name="password" label="New password" type="password" required autoComplete="new-password" />
        <SubmitButton size="sm" variant="secondary" className="h-11">Reset</SubmitButton>
      </ActionForm>
    </details>
  );
}

export function ChangePasswordForm() {
  return (
    <ActionForm action={changeOwnPasswordAction} className="grid max-w-sm gap-4" resetOnSuccess>
      <TextField name="currentPassword" label="Current password" type="password" required autoComplete="current-password" />
      <TextField name="newPassword" label="New password" type="password" required autoComplete="new-password" hint="At least 12 characters with letters and a number" />
      <div><SubmitButton>Change password</SubmitButton></div>
    </ActionForm>
  );
}
