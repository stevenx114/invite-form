import Link from "next/link";

export default function InviteNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-ink">
        Invite not found
      </h1>
      <p className="mt-3 text-ink-soft">
        This personalised link is invalid or has been removed. Please ask the
        host for a new invite link.
      </p>
      <Link href="/admin" className="btn-secondary mt-8 inline-flex">
        Admin
      </Link>
    </main>
  );
}
