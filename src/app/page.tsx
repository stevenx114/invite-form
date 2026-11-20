import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="hero-zoom absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/beachcomber-hq.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/45 to-ink/80" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center text-white">
        <p className="animate-fade text-xs font-semibold uppercase tracking-[0.35em]">
          Gosford Tailoring
        </p>
        <h1 className="animate-rise mt-5 font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-6xl">
          Christmas Party &amp; Leanne&apos;s Retirement
        </h1>
        <p className="animate-rise-delay-1 mt-4 max-w-xl text-lg text-white/85">
          Personalised invitations for our celebration at Beachcomber Hotel and
          Resort on December 12th 2026.
        </p>
        <p className="animate-rise-delay-2 mt-8 font-[family-name:var(--font-script)] text-4xl text-gold-soft">
          celebrate together
        </p>
        <div className="animate-rise-delay-2 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-sage px-6 py-3 font-semibold text-white transition hover:bg-sage-deep"
          >
            Open admin
          </Link>
        </div>
        <p className="mt-8 max-w-md text-sm text-white/70">
          Guests should open the personal link you send them. This page is for
          hosts only.
        </p>
      </div>
    </main>
  );
}
