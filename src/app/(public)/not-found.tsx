import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="on-ink -mt-[68px] bg-ink-950 px-4 pb-28 pt-[140px] text-center">
      <p className="font-mono text-sm uppercase tracking-[0.16em] text-mint">404</p>
      <h1 className="mx-auto mt-4 max-w-[18ch] text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">We could not find that page</h1>
      <p className="mx-auto mt-4 max-w-[44ch] text-lg text-on-ink-muted">The link may be incomplete. Request status links must be copied in full.</p>
      <LinkButton href="/" variant="mint" size="lg" className="mt-8 px-7">Go to the home page</LinkButton>
    </div>
  );
}
