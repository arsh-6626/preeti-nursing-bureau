import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-navy-900">We could not find that page</h1>
      <p className="mt-2 text-muted">The link may be incomplete. Request status links must be copied in full.</p>
      <LinkButton href="/" className="mt-6">Go to the home page</LinkButton>
    </div>
  );
}
