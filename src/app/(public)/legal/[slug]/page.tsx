import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT_PAGES, getContentPage } from "@/lib/services/settings";
import { PageIntro } from "@/components/public/page-intro";
import { PlainText } from "@/components/public/plain-text";
import { formatDate } from "@/lib/domain/dates";

const ALLOWED = new Set<string>(CONTENT_PAGES.map((p) => p.slug));

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: CONTENT_PAGES.find((p) => p.slug === slug)?.title ?? "Policy" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  if (!ALLOWED.has(slug)) notFound();
  const page = await getContentPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageIntro title={page.title} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="mb-6 text-sm text-muted">Last updated {formatDate(page.updatedAt)}</p>
        <PlainText text={page.body} />
      </div>
    </>
  );
}
