import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/RsvpForm";
import { getGuestByToken, getResponseByGuestId } from "@/lib/db";

async function InviteContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = getGuestByToken(token);
  if (!guest) notFound();

  const response = getResponseByGuestId(guest.id) ?? null;
  return <RsvpForm guest={guest} existing={response} />;
}

export default function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
          <p className="text-ink-soft">Loading your invitation…</p>
        </main>
      }
    >
      <InviteContent params={params} />
    </Suspense>
  );
}
