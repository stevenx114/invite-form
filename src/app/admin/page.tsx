import { Suspense } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { isAuthenticated } from "@/lib/auth";

async function AdminContent() {
  const authenticated = await isAuthenticated();
  return <AdminDashboard initiallyAuthenticated={authenticated} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
          <p className="text-ink-soft">Loading admin…</p>
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
