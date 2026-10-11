import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { PlainText } from "@/components/public/plain-text";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "About us" };

export default async function AboutPage() {
  const settings = await getPublicSettings();
  return (
    <>
      <PageIntro title={`About ${settings.businessName}`}>How we connect families with caregivers.</PageIntro>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {settings.aboutText ? <PlainText text={settings.aboutText} /> : <p className="text-muted">More about us is coming soon.</p>}
        <LinkButton href="/request" size="lg" className="mt-10">Find a Caregiver</LinkButton>
      </div>
    </>
  );
}
