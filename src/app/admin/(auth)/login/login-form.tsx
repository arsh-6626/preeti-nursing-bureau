"use client";

import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";
import { loginAction } from "@/app/admin/actions/auth";

export function LoginForm() {
  return (
    <ActionForm action={loginAction} className="mt-6 grid gap-4">
      <TextField name="email" label="Email" type="email" autoComplete="username" required />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      <SubmitButton className="mt-2 w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
    </ActionForm>
  );
}
