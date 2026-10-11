import { LinkButton } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="max-w-lg py-10">
      <h1 className="text-2xl font-semibold text-navy-900">You do not have access to this page</h1>
      <p className="mt-2 text-muted">Ask an administrator if you need access.</p>
      <LinkButton href="/admin" variant="secondary" className="mt-6">Back to dashboard</LinkButton>
    </div>
  );
}
