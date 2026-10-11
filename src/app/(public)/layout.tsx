import { connection } from "next/server";
import { getPublicSettings } from "@/lib/services/settings";
import { telHref } from "@/lib/contact";
import { Brand } from "@/components/public/brand";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { MobileActionBar } from "@/components/public/mobile-action-bar";
import { PageCurtain } from "@/components/public/page-curtain";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  // Public pages read live settings, services and areas from the database,
  // so they render per request instead of being prerendered at build time.
  await connection();
  const settings = await getPublicSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <SiteHeader brand={<Brand name={settings.businessName} logoUrl={settings.logoUrl} />} tel={telHref(settings.phone)} />
      <main id="main" className="pnb-grain flex-1 bg-paper-2 text-text">{children}</main>
      <SiteFooter settings={settings} />
      <MobileActionBar tel={telHref(settings.phone)} />
      <PageCurtain />
    </>
  );
}
