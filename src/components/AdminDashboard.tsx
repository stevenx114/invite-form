"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { GuestWithResponse } from "@/lib/types";

type Props = {
  initiallyAuthenticated: boolean;
};

export function AdminDashboard({ initiallyAuthenticated }: Props) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [guests, setGuests] = useState<GuestWithResponse[]>([]);
  const [loading, setLoading] = useState(initiallyAuthenticated);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkCreating, setBulkCreating] = useState(false);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guests");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setGuests(data.guests ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadGuests();
    }
  }, [authenticated, loadGuests]);

  const stats = useMemo(() => {
    const total = guests.length;
    const responded = guests.filter((g) => g.response).length;
    const attending = guests.filter((g) => g.response?.attending === "yes").length;
    const declined = guests.filter((g) => g.response?.attending === "no").length;
    return { total, responded, attending, declined, pending: total - responded };
  }, [guests]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || "Login failed");
        return;
      }
      setAuthenticated(true);
      setPassword("");
    } catch {
      setLoginError("Could not sign in");
    } finally {
      setLoggingIn(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setGuests([]);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, organization, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Could not create guest");
        return;
      }
      setGuests((prev) => [data.guest, ...prev]);
      setName("");
      setOrganization("");
      setEmail("");
    } catch {
      setFormError("Could not create guest");
    } finally {
      setCreating(false);
    }
  }

  async function onBulkCreate(event: FormEvent) {
    event.preventDefault();
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setBulkCreating(true);
    setFormError("");
    try {
      const created: GuestWithResponse[] = [];
      for (const line of lines) {
        const [guestName, ...rest] = line.split(",").map((p) => p.trim());
        if (!guestName) continue;
        const guestEmail = rest.find((p) => p.includes("@")) ?? "";
        const orgParts = rest.filter((p) => p && p !== guestEmail);
        const res = await fetch("/api/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: guestName,
            organization: orgParts.join(", "),
            email: guestEmail,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || `Failed on "${guestName}"`);
          break;
        }
        created.push(data.guest);
      }
      if (created.length) {
        setGuests((prev) => [...created.reverse(), ...prev]);
        setBulkText("");
      }
    } finally {
      setBulkCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this guest and their RSVP?")) return;
    const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
    }
  }

  async function copyLink(guest: GuestWithResponse) {
    await navigator.clipboard.writeText(guest.inviteUrl);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId((current) => (current === guest.id ? null : current)), 1600);
  }

  function gmailComposeUrl(guest: GuestWithResponse) {
    const subject = "You're invited: Christmas & Retirement Celebration";
    const body = [
      `Dear ${guest.name},`,
      "",
      "You're warmly invited to our Christmas & Retirement celebration. Please RSVP using your personal link below:",
      "",
      guest.inviteUrl,
      "",
      "Kind regards,",
    ].join("\n");
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: guest.email ?? "",
      su: subject,
      body,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  async function onSetEmail(guest: GuestWithResponse) {
    const input = prompt(`Email address for ${guest.name}:`, guest.email ?? "");
    if (input === null) return;
    const res = await fetch(`/api/guests/${guest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: input }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not save email");
      return;
    }
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, email: data.email } : g)),
    );
  }

  function exportCsv() {
    const header = [
      "Name",
      "Organization",
      "Email",
      "Invite URL",
      "Responded",
      "Attending",
      "Lunch",
      "Dietary",
      "Dietary Details",
      "Submitted At",
    ];
    const rows = guests.map((g) => [
      g.name,
      g.organization,
      g.email ?? "",
      g.inviteUrl,
      g.response ? "yes" : "no",
      g.response?.attending ?? "",
      g.response?.lunch ?? "",
      g.response?.dietary ?? "",
      g.response?.dietaryDetails ?? "",
      g.response?.submittedAt ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp-responses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4">
        <div className="field-card animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
            Host access
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-ink">
            Admin
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Sign in to create personalised invite links and review RSVPs.
          </p>
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-coral">{loginError}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loggingIn}>
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">
            Christmas &amp; Retirement RSVP
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-ink sm:text-5xl">
            Guest invites
          </h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            Create a personalised link for each guest. Their name appears in the
            Dear line and thank-you message.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>

      <section className="animate-rise-delay-1 mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Guests", stats.total],
          ["Responded", stats.responded],
          ["Attending", stats.attending],
          ["Declined", stats.declined],
          ["Pending", stats.pending],
        ].map(([label, value]) => (
          <div key={label as string} className="field-card !p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-ink">
              {value}
            </p>
          </div>
        ))}
      </section>

      <div className="animate-rise-delay-2 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <form onSubmit={onCreate} className="field-card space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Add guest
            </h2>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Guest name
              </label>
              <input
                id="name"
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Steven Xu"
                required
              />
            </div>
            <div>
              <label
                htmlFor="organization"
                className="mb-1.5 block text-sm font-medium"
              >
                Organisation{" "}
                <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="organization"
                className="admin-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Gorokan Public School"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email{" "}
                <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                className="admin-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="steven@example.com"
              />
            </div>
            {formError && <p className="text-sm text-coral">{formError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={creating}>
              {creating ? "Creating…" : "Create personalised link"}
            </button>
          </form>

          <form onSubmit={onBulkCreate} className="field-card space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              Bulk add
            </h2>
            <p className="text-sm text-ink-soft">
              One guest per line. Optional organisation and email after commas.
              <br />
              <code className="text-xs">Steven Xu, Gorokan Public School, steven@example.com</code>
            </p>
            <textarea
              className="admin-input min-h-36 resize-y font-mono text-sm"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Steven Xu, Gorokan Public School, steven@example.com\nJane Smith"}
            />
            <button
              type="submit"
              className="btn-secondary w-full"
              disabled={bulkCreating}
            >
              {bulkCreating ? "Creating…" : "Create all links"}
            </button>
          </form>
        </aside>

        <section className="field-card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              All guests
            </h2>
            <button type="button" className="btn-secondary !py-2 !px-3 text-sm" onClick={loadGuests}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="px-5 py-10 text-ink-soft">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="px-5 py-10 text-ink-soft">
              No guests yet. Add someone on the left to generate their invite
              link.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {guests.map((guest) => (
                <li key={guest.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-ink">
                        {guest.name}
                      </p>
                      {guest.organization && (
                        <p className="text-sm text-ink-soft">{guest.organization}</p>
                      )}
                      {guest.email && (
                        <p className="text-sm text-ink-soft">{guest.email}</p>
                      )}
                      <p className="mt-2 break-all font-mono text-xs text-ink-soft">
                        {guest.inviteUrl}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {guest.response ? (
                          <>
                            <StatusChip
                              tone={
                                guest.response.attending === "yes"
                                  ? "good"
                                  : "warn"
                              }
                            >
                              {guest.response.attending === "yes"
                                ? "Attending"
                                : "Not attending"}
                            </StatusChip>
                            {guest.response.lunch && (
                              <StatusChip tone="neutral">
                                Lunch chosen
                              </StatusChip>
                            )}
                            {guest.response.dietary === "yes" && (
                              <StatusChip tone="warn">Dietary needs</StatusChip>
                            )}
                          </>
                        ) : (
                          <StatusChip tone="neutral">Awaiting RSVP</StatusChip>
                        )}
                      </div>
                      {guest.response?.dietary === "yes" &&
                        guest.response.dietaryDetails && (
                          <p className="mt-2 text-sm text-ink-soft">
                            Dietary: {guest.response.dietaryDetails}
                          </p>
                        )}
                      {guest.response?.lunch && (
                        <p className="mt-1 text-sm text-ink-soft">
                          Lunch: {guest.response.lunch}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary !py-2 !px-3 text-sm"
                        onClick={() => copyLink(guest)}
                      >
                        {copiedId === guest.id ? "Copied" : "Copy link"}
                      </button>
                      {guest.email ? (
                        <a
                          href={gmailComposeUrl(guest)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center"
                        >
                          Email
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary !py-2 !px-3 text-sm"
                          onClick={() => onSetEmail(guest)}
                        >
                          Add email
                        </button>
                      )}
                      <a
                        href={guest.inviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        className="btn-secondary !py-2 !px-3 text-sm text-coral"
                        onClick={() => onDelete(guest.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "warn" | "neutral";
}) {
  const styles =
    tone === "good"
      ? "bg-sage/15 text-sage-deep"
      : tone === "warn"
        ? "bg-coral/10 text-coral"
        : "bg-sand-deep text-ink-soft";
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${styles}`}>
      {children}
    </span>
  );
}
