import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentActor } from "@/lib/auth/dal";
import { getSettings } from "@/lib/services/settings";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await currentActor()) redirect("/admin");
  const settings = await getSettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-sm font-semibold text-muted">{settings.businessName}</p>
        <div className="mt-3 rounded-[var(--radius-panel)] border border-line bg-paper p-6 shadow-[var(--shadow-raise)]">
          <h1 className="text-xl font-semibold text-navy-900">Staff sign in</h1>
          <p className="mt-1 text-sm text-muted">For bureau staff only.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
