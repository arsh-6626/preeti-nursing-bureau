import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-field px-4 pb-28 pt-24 text-center">
      <p className="text-sm font-semibold text-marigold">404</p>
      <h1 className="mx-auto mt-4 max-w-[18ch] font-display text-4xl font-bold tracking-[-0.025em] text-white sm:text-5xl">We could not find that page</h1>
      <p className="mx-auto mt-4 max-w-[44ch] text-lg text-field-soft">The link may be incomplete. Request status links must be copied in full.</p>
      <LinkButton href="/" variant="marigold" size="lg" className="mt-8 px-7">Go to the home page</LinkButton>
    </div>
  );
}
