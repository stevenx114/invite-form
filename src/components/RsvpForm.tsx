"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { LUNCH_OPTIONS, type Guest, type RsvpResponse } from "@/lib/types";

type Props = {
  guest: Guest;
  existing: RsvpResponse | null;
};

export function RsvpForm({ guest, existing }: Props) {
  const [attending, setAttending] = useState<"yes" | "no" | "">(
    existing?.attending ?? "",
  );
  const [lunch, setLunch] = useState(existing?.lunch ?? "");
  const [dietary, setDietary] = useState<"yes" | "no" | "">(
    existing?.dietary ?? "",
  );
  const [dietaryDetails, setDietaryDetails] = useState(
    existing?.dietaryDetails ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(Boolean(existing));
  const [submittedAt, setSubmittedAt] = useState(existing?.submittedAt ?? "");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/rsvp/${guest.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attending,
          lunch,
          dietary,
          dietaryDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setDone(true);
      setSubmittedAt(data.response.submittedAt);
    } catch {
      setError("Could not submit your RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const gratitudeLine = guest.organization
    ? (
        <>
          We would like to extend our sincere gratitude to{" "}
          <strong>{guest.name}</strong> and{" "}
          <strong>{guest.organization}</strong> for their continued support of
          Gosford Tailoring over the years.
        </>
      )
    : (
        <>
          We would like to extend our sincere gratitude to{" "}
          <strong>{guest.name}</strong> for their continued support of Gosford
          Tailoring over the years.
        </>
      );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <header className="animate-rise mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
          Gosford Tailoring
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-ink sm:text-5xl">
          RSVP — Christmas Party and Leanne&apos;s{" "}
          <em className="italic text-ink-soft">Retirement</em>
        </h1>
      </header>

      <section className="animate-rise-delay-1 field-card mb-6 invite-prose text-[1.02rem] text-ink-soft">
        <p>
          <span className="font-semibold text-ink">Dear:</span>{" "}
          <span className="font-[family-name:var(--font-script)] text-3xl leading-none text-gold">
            {guest.name}
          </span>
        </p>
        <p className="text-xl font-medium text-ink">Merry Christmas!</p>
        <p>{gratitudeLine}</p>
        <p>Welcome to join our Christmas Party and Leanne&apos;s Retirement.</p>
        <p>
          After 27 years of hard work, dedication and wonderful memories, it&apos;s
          time to celebrate Leanne and wish her a very happy retirement! We are
          incredibly grateful for all her hard work and the contributions she has
          made over the years.
        </p>
        <p>
          We&apos;d love for you to join us in giving Leanne a special send-off,
          sharing some laughs and creating a few more wonderful memories together.
          Please take a moment to complete this RSVP form and let us know whether
          you&apos;ll be joining us.
        </p>
        <p>
          The celebration will be held at{" "}
          <strong>Beachcomber Hotel and Resort</strong>, starting at{" "}
          <strong>12:00 pm</strong> on <strong>December 12th 2026</strong>.
        </p>
        <p>
          We look forward to celebrating this special occasion with you!
          <br />
          Kind Regards,
          <br />
          Gary Xu and Leanne Bailey
        </p>
        <p className="text-sm">
          Gary Contact Number: 0416119119
          <br />
          Leanne Contact Number: 0450568211
        </p>
      </section>

      <section className="animate-rise-delay-2 relative mb-6 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(12,35,64,0.18)]">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src="/images/beachcomber.jpg"
            alt="Beachcomber Hotel and Resort"
            fill
            priority
            className="hero-zoom object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.35em]">
              Beachcomber
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.28em] opacity-90">
              Hotel &amp; Resort
            </p>
          </div>
          <div className="absolute bottom-5 left-0 right-0 text-center text-white">
            <p className="text-xs tracking-[0.2em]">2026 — 2027</p>
            <p className="font-[family-name:var(--font-script)] text-3xl text-gold-soft">
              celebrate together
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
              SOCIAL EVENTS
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_10px_30px_rgba(12,35,64,0.04)]">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
            Pelican Restaurant
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Lunch will be served at Pelican Restaurant inside Beachcomber Hotel
            and Resort.
          </p>
        </div>
        <div className="relative aspect-[16/9] w-full">
          <Image
            src="/images/pelican.jpg"
            alt="Pelican Restaurant dining room"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      </section>

      {done ? (
        <section className="field-card animate-rise text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-ink">
            Thank you, {guest.name}
          </p>
          <p className="mt-3 text-ink-soft">
            Your RSVP has been received
            {submittedAt
              ? ` on ${new Date(submittedAt).toLocaleString()}`
              : ""}
            .
          </p>
          <button
            type="button"
            className="btn-secondary mt-6"
            onClick={() => setDone(false)}
          >
            Update my response
          </button>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <fieldset className="field-card">
            <legend className="mb-3 text-base font-semibold text-ink">
              Do you have any dietary requirements, restrictions, or food
              allergies? <span className="text-coral">*</span>
            </legend>
            <div className="space-y-1">
              {(["no", "yes"] as const).map((value) => (
                <label key={value} className="radio-row">
                  <input
                    type="radio"
                    name="dietary"
                    value={value}
                    checked={dietary === value}
                    onChange={() => setDietary(value)}
                    required
                  />
                  <span className="capitalize">{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {dietary === "yes" && (
            <div className="field-card animate-rise">
              <label
                htmlFor="dietaryDetails"
                className="mb-3 block text-base font-semibold text-ink"
              >
                If yes, please provide details.{" "}
                <span className="text-coral">*</span>
              </label>
              <textarea
                id="dietaryDetails"
                className="admin-input min-h-28 resize-y"
                value={dietaryDetails}
                onChange={(e) => setDietaryDetails(e.target.value)}
                required
                placeholder="Please share any allergies or dietary needs"
              />
            </div>
          )}

          <fieldset className="field-card">
            <legend className="mb-3 text-base font-semibold text-ink">
              Please select your choice of lunch{" "}
              <span className="font-normal text-ink-soft">(optional)</span>
            </legend>
            <div className="space-y-1">
              {LUNCH_OPTIONS.map((option) => (
                <label key={option} className="radio-row">
                  <input
                    type="radio"
                    name="lunch"
                    value={option}
                    checked={lunch === option}
                    onChange={() => setLunch(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
              {lunch && (
                <button
                  type="button"
                  className="mt-2 text-sm text-sage underline-offset-2 hover:underline"
                  onClick={() => setLunch("")}
                >
                  Clear lunch selection
                </button>
              )}
            </div>
          </fieldset>

          <fieldset className="field-card">
            <legend className="mb-3 text-base font-semibold text-ink">
              Would you be available and wish to attend the Christmas Celebration
              and Retirement Farewell in honour of Leanne?{" "}
              <span className="text-coral">*</span>
            </legend>
            <div className="space-y-1">
              {(["yes", "no"] as const).map((value) => (
                <label key={value} className="radio-row">
                  <input
                    type="radio"
                    name="attending"
                    value={value}
                    checked={attending === value}
                    onChange={() => setAttending(value)}
                    required
                  />
                  <span className="capitalize">{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit RSVP"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
