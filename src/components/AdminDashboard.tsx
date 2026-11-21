"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { GuestWithResponse } from "@/lib/types";

type StatusFilter =
  | "all"
  | "pending"
  | "attending"
  | "declined"
  | "emailed"
  | "not-emailed"
  | "no-email";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending: "Awaiting RSVP",
  attending: "Attending",
  declined: "Not attending",
  emailed: "Emailed",
  "not-emailed": "Not emailed",
  "no-email": "No email address",
};

function matchesFilter(guest: GuestWithResponse, filter: StatusFilter) {
  switch (filter) {
    case "pending":
      return !guest.response;
    case "attending":
      return guest.response?.attending === "yes";
    case "declined":
      return guest.response?.attending === "no";
    case "emailed":
      return Boolean(guest.emailedAt);
    case "not-emailed":
      return !guest.emailedAt;
    case "no-email":
      return !guest.email;
    default:
      return true;
  }
}

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
  const [emailedId, setEmailedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (!matchesFilter(g, statusFilter)) return false;
      if (!query) return true;
      return [g.name, g.organization, g.email ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [guests, search, statusFilter]);

  const filtersActive = search.trim() !== "" || statusFilter !== "all";

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

  const EMAIL_SUBJECT =
    "You're invited: Gosford Tailoring Christmas & Leanne's Retirement Celebration";

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // Rich version of the email, matching the fonts/sizes of the original signature.
  // HTML font sizes: 1 = 10px, 2 = 13px, 4 = 18px.
  function buildEmailHtml(guest: GuestWithResponse) {
    const name = escapeHtml(guest.name);
    const url = escapeHtml(guest.inviteUrl);
    const tre = "font-family:'trebuchet ms',sans-serif";
    return `<div style="font-family:arial,helvetica,sans-serif;font-size:small">
<div>Dear ${name},</div><br>
<div>You're warmly invited to our Christmas &amp; Leanne's Retirement celebration. Please RSVP using the link below:</div><br>
<div><a href="${url}">${url}</a></div><br>
<div>
<div><font color="#000000" face="arial,helvetica,sans-serif" size="2" style="background-color:rgb(255,255,255)">Best regards,</font></div>
<div><br></div>
<div><strong><font size="4">Gary Xu / Leanne Bailey</font></strong></div>
<div><strong><font style="${tre}" size="2">Mobile:0416119119</font></strong></div>
<div><font size="4" style="${tre}">Gosford Tailoring Co P/L</font></div>
<div><font size="4" style="${tre}">Ozsports International P/L</font></div>
<div style="${tre}">35 Shirlow St.&nbsp; Marrickville, NSW 2204</div>
<div style="${tre}">Tel:(02) 9550 1289</div>
<div style="${tre}">Email:&nbsp;&nbsp;&nbsp;&nbsp; <a href="mailto:gary@ozsports.net.au" style="color:#0000ff">gary@ozsports.net.au</a></div>
<div style="${tre}">Website:&nbsp;<a href="http://www.ozsports.net.au/" style="color:#1155cc">www.ozsports.net.au</a></div>
<div><br></div>
<p>IMPORTANT: This message may contain confidential or legally privileged information. If you think it was sent to you by mistake, please delete all copies and advise the sender. For the purposes of the SPAM Act 2003, this email is authorised by<font size="1" style="${tre}">&nbsp;Ozsports International P/L.</font></p>
</div>
</div>`;
  }

  function buildEmailText(guest: GuestWithResponse) {
    return [
      `Dear ${guest.name},`,
      "",
      "You're warmly invited to our Christmas & Leanne's Retirement celebration. Please RSVP using the link below:",
      "",
      guest.inviteUrl,
      "",
      "Best regards,",
      "",
      "Gary Xu / Leanne Bailey",
      "Mobile:0416119119",
      "Gosford Tailoring Co P/L",
      "Ozsports International P/L",
      "35 Shirlow St.  Marrickville, NSW 2204",
      "Tel:(02) 9550 1289",
      "Email: gary@ozsports.net.au",
      "Website: www.ozsports.net.au",
      "",
      "IMPORTANT: This message may contain confidential or legally privileged information. If you think it was sent to you by mistake, please delete all copies and advise the sender. For the purposes of the SPAM Act 2003, this email is authorised by Ozsports International P/L.",
    ].join("\n");
  }

  // Gmail compose links only support plain text, so the formatted email is put
  // on the clipboard and the draft opens with the recipient + subject filled in.
  // Paste (Cmd/Ctrl+V) into the draft body to get the full formatting.
  function gmailComposeUrl(guest: GuestWithResponse) {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: guest.email ?? "",
      su: EMAIL_SUBJECT,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  function copyFormattedEmail(guest: GuestWithResponse) {
    // Not awaited on purpose so the Gmail tab still opens from the same click.
    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": new Blob([buildEmailHtml(guest)], { type: "text/html" }),
          "text/plain": new Blob([buildEmailText(guest)], { type: "text/plain" }),
        }),
      ])
      .catch(() => {
        void navigator.clipboard.writeText(buildEmailText(guest));
      });
    setEmailedId(guest.id);
    void setEmailedStatus(guest.id, true);
    setTimeout(
      () => setEmailedId((current) => (current === guest.id ? null : current)),
      6000,
    );
  }

  // Records that the email draft was opened for this guest. Gmail links can't
  // report whether the message was actually sent, so this is click-based.
  async function setEmailedStatus(id: string, emailed: boolean) {
    const res = await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailed }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, emailedAt: data.emailedAt ?? undefined } : g,
      ),
    );
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
      "Emailed At",
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
      g.emailedAt ?? "",
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
              {!loading && guests.length > 0 && (
                <span className="ml-2 text-base font-normal text-ink-soft">
                  {filtersActive
                    ? `${filteredGuests.length} of ${guests.length}`
                    : guests.length}
                </span>
              )}
            </h2>
            <button type="button" className="btn-secondary !py-2 !px-3 text-sm" onClick={loadGuests}>
              Refresh
            </button>
          </div>

          {!loading && guests.length > 0 && (
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
              {/* .admin-input is width:100%, so size via wrappers instead */}
              <div className="min-w-0 sm:flex-1">
                <input
                  type="search"
                  className="admin-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, school or email"
                  aria-label="Search guests"
                />
              </div>
              <div className="sm:w-56 sm:shrink-0">
                <select
                  className="admin-input"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  aria-label="Filter guests by status"
                >
                  {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
                    <option key={key} value={key}>
                      {FILTER_LABELS[key]} (
                      {guests.filter((g) => matchesFilter(g, key)).length})
                    </option>
                  ))}
                </select>
              </div>
              {filtersActive && (
                <button
                  type="button"
                  className="btn-secondary !py-2 !px-3 text-sm sm:shrink-0"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {loading ? (
            <p className="px-5 py-10 text-ink-soft">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="px-5 py-10 text-ink-soft">
              No guests yet. Add someone on the left to generate their invite
              link.
            </p>
          ) : filteredGuests.length === 0 ? (
            <p className="px-5 py-10 text-ink-soft">
              No guests match your search or filter.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {filteredGuests.map((guest) => (
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
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {guest.emailedAt && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-2.5 py-1 font-medium text-sage-deep">
                            ✓ Emailed{" "}
                            {new Date(guest.emailedAt).toLocaleDateString(
                              "en-AU",
                              { day: "numeric", month: "short" },
                            )}
                            <button
                              type="button"
                              className="ml-0.5 text-sage-deep/70 underline hover:text-sage-deep"
                              onClick={() => setEmailedStatus(guest.id, false)}
                              title="Clear the emailed mark"
                            >
                              undo
                            </button>
                          </span>
                        )}
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
                          onClick={() => copyFormattedEmail(guest)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center"
                        >
                          {emailedId === guest.id
                            ? "Paste in draft (⌘V)"
                            : guest.emailedAt
                              ? "Email again"
                              : "Email"}
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
