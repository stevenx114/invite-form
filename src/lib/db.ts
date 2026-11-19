import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Database, Guest, RsvpResponse } from "./types";

const DATA_DIR =
  process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");

function emptyDb(): Database {
  return { guests: [], responses: [] };
}

function ensureDb(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    const db = emptyDb();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    return db;
  }
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

function saveDb(db: Database) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function listGuests(): Guest[] {
  return ensureDb().guests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGuestByToken(token: string): Guest | undefined {
  return ensureDb().guests.find((g) => g.token === token);
}

export function getGuestById(id: string): Guest | undefined {
  return ensureDb().guests.find((g) => g.id === id);
}

export function createGuest(input: {
  name: string;
  organization?: string;
}): Guest {
  const db = ensureDb();
  const guest: Guest = {
    id: nanoid(12),
    token: nanoid(16),
    name: input.name.trim(),
    organization: (input.organization ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
  db.guests.push(guest);
  saveDb(db);
  return guest;
}

export function deleteGuest(id: string): boolean {
  const db = ensureDb();
  const before = db.guests.length;
  db.guests = db.guests.filter((g) => g.id !== id);
  db.responses = db.responses.filter((r) => r.guestId !== id);
  if (db.guests.length === before) return false;
  saveDb(db);
  return true;
}

export function getResponseByGuestId(guestId: string): RsvpResponse | undefined {
  return ensureDb().responses.find((r) => r.guestId === guestId);
}

export function listResponses(): RsvpResponse[] {
  return ensureDb().responses.sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt),
  );
}

export function upsertResponse(
  guestId: string,
  input: Omit<RsvpResponse, "id" | "guestId" | "submittedAt">,
): RsvpResponse {
  const db = ensureDb();
  const existing = db.responses.find((r) => r.guestId === guestId);
  const next: RsvpResponse = {
    id: existing?.id ?? nanoid(12),
    guestId,
    attending: input.attending,
    lunch: input.lunch,
    dietary: input.dietary,
    dietaryDetails: input.dietaryDetails,
    submittedAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, next);
  } else {
    db.responses.push(next);
  }
  saveDb(db);
  return next;
}
