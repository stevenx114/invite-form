"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { LUNCH_OPTIONS, type Guest, type RsvpResponse } from "@/lib/types";

type Props = {
  guest: Guest;
  existing: RsvpResponse | null;
};

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

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

  const gratitudeLine = guest.organization ? (
    <>
      We would like to extend our sincere gratitude to{" "}
      <strong>{guest.name}</strong> and <strong>{guest.organization}</strong>{" "}
      for their continued support of Gosford Tailoring over the years.
    </>
  ) : (
    <>
      We would like to extend our sincere gratitude to{" "}
      <strong>{guest.name}</strong> for their continued support of Gosford
      Tailoring over the years.
    </>
  );

  return (
    <div className="event-page">
      <div className="event-shell">
        <div className="event-hero animate-fade">
          <Image
            src="/images/beachcomber-hq.jpg"
            alt="Beachcomber Hotel and Resort"
            fill
            priority
            quality={95}
            className="object-cover object-center"
            sizes="(max-width: 1100px) 100vw, 1100px"
          />
        </div>

        <div className="event-grid">
          <header className="event-header animate-rise">
            <p className="event-eyebrow">Gosford Tailoring</p>
            <p className="event-greeting">
              Dear <span>{guest.name}</span>
            </p>
            <h1 className="event-title">
              Christmas Party and Leanne&apos;s{" "}
              <em>Retirement</em>
            </h1>
            <ul className="event-meta">
              <li>
                <CalendarIcon />
                <span>Sat, 12 Dec 2026 · 12:00 pm</span>
              </li>
              <li>
                <PinIcon />
                <span>
                  Beachcomber Hotel and Resort, 200 Main Rd, Toukley NSW 2263
                </span>
              </li>
            </ul>
          </header>

          <aside className="event-sidebar animate-rise-delay-1">
            <div className="event-sidebar-inner">
              {done ? (
                <div className="rsvp-card">
                  <p className="rsvp-card-label">RSVP received</p>
                  <h2 className="rsvp-card-title">Thank you, {guest.name}</h2>
                  <p className="rsvp-card-copy">
                    Your response has been saved
                    {submittedAt
                      ? ` on ${new Date(submittedAt).toLocaleString()}`
                      : ""}
                    .
                  </p>
                  <button
                    type="button"
                    className="rsvp-btn-secondary"
                    onClick={() => setDone(false)}
                  >
                    Update response
                  </button>
                </div>
              ) : (
                <form className="rsvp-card" onSubmit={onSubmit}>
                  <p className="rsvp-card-label">RSVP</p>
                  <h2 className="rsvp-card-title">Confirm your attendance</h2>
                  <p className="rsvp-card-copy">
                    Personal invite for <strong>{guest.name}</strong>
                  </p>

                  <fieldset className="rsvp-field">
                    <legend>
                      Attending? <span>*</span>
                    </legend>
                    <div className="rsvp-options">
                      {(["yes", "no"] as const).map((value) => (
                        <label key={value} className="rsvp-option">
                          <input
                            type="radio"
                            name="attending"
                            value={value}
                            checked={attending === value}
                            onChange={() => setAttending(value)}
                            required
                          />
                          <span>
                            {value === "yes"
                              ? "Yes, I'll be there"
                              : "No, I can't make it"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="rsvp-field">
                    <legend>
                      Dietary requirements? <span>*</span>
                    </legend>
                    <div className="rsvp-options">
                      {(["no", "yes"] as const).map((value) => (
                        <label key={value} className="rsvp-option">
                          <input
                            type="radio"
                            name="dietary"
                            value={value}
                            checked={dietary === value}
                            onChange={() => setDietary(value)}
                            required
                          />
                          <span>{value === "yes" ? "Yes" : "No"}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {dietary === "yes" && (
                    <div className="rsvp-field">
                      <label htmlFor="dietaryDetails">
                        Please provide details <span>*</span>
                      </label>
                      <textarea
                        id="dietaryDetails"
                        value={dietaryDetails}
                        onChange={(e) => setDietaryDetails(e.target.value)}
                        required
                        placeholder="Allergies or dietary needs"
                      />
                    </div>
                  )}

                  <fieldset className="rsvp-field">
                    <legend>
                      Lunch choice <em>(optional)</em>
                    </legend>
                    <div className="rsvp-options">
                      {LUNCH_OPTIONS.map((option) => (
                        <label key={option} className="rsvp-option">
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
                    </div>
                    {lunch && (
                      <button
                        type="button"
                        className="rsvp-clear"
                        onClick={() => setLunch("")}
                      >
                        Clear lunch selection
                      </button>
                    )}
                  </fieldset>

                  {error && <p className="rsvp-error">{error}</p>}

                  <button
                    type="submit"
                    className="rsvp-btn"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit RSVP"}
                  </button>
                </form>
              )}
            </div>
          </aside>

          <div className="event-main animate-rise-delay-1">
            <section className="event-section event-section-first">
              <h2>Description</h2>
              <div className="event-prose">
                <p className="event-kicker">Merry Christmas!</p>
                <p>{gratitudeLine}</p>
                <p>
                  Welcome to join our Christmas Party and Leanne&apos;s
                  Retirement.
                </p>
                <p>
                  After 27 years of hard work, dedication and wonderful
                  memories, it&apos;s time to celebrate Leanne and wish her a
                  very happy retirement! We are incredibly grateful for all her
                  hard work and the contributions she has made over the years.
                </p>
                <p>
                  We&apos;d love for you to join us in giving Leanne a special
                  send-off, sharing some laughs and creating a few more
                  wonderful memories together. Please take a moment to complete
                  this RSVP form and let us know whether you&apos;ll be joining
                  us.
                </p>
                <p>
                  The celebration will be held at{" "}
                  <strong>Beachcomber Hotel and Resort</strong>, starting at{" "}
                  <strong>12:00 pm</strong> on{" "}
                  <strong>December 12th 2026</strong>.
                </p>
              </div>
            </section>

            <section className="event-section">
              <h2>Venue</h2>
              <div className="event-venue-card">
                <div className="event-venue-copy">
                  <p className="event-venue-name">Pelican Restaurant</p>
                  <p>
                    Lunch will be served at Pelican Restaurant inside Beachcomber
                    Hotel and Resort.
                  </p>
                </div>
                <div className="event-venue-image">
                  <Image
                    src="/images/pelican-hq.jpg"
                    alt="Pelican Restaurant dining room"
                    fill
                    quality={95}
                    className="object-cover"
                    sizes="(max-width: 960px) 100vw, 720px"
                  />
                </div>
              </div>
            </section>

            <section className="event-section">
              <h2>Location</h2>
              <p className="event-location-name">Beachcomber Hotel and Resort</p>
              <p className="event-muted">200 Main Rd, Toukley NSW 2263</p>
              <p className="event-muted">
                Starting at 12:00 pm on December 12th 2026
              </p>
            </section>

            <section className="event-section">
              <h2>Host information</h2>
              <p className="event-host-name">Gary Xu and Leanne Bailey</p>
              <p className="event-muted">Gosford Tailoring</p>
              <p className="event-muted">
                Gary: 0416119119
                <br />
                Leanne: 0450568211
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
