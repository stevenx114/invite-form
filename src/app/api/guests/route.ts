import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createGuest,
  getResponseByGuestId,
  listGuests,
} from "@/lib/db";

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const guests = listGuests().map((guest) => ({
    ...guest,
    response: getResponseByGuestId(guest.id) ?? null,
    inviteUrl: `${origin}/invite/${guest.token}`,
  }));

  return NextResponse.json({ guests });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    organization?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const guest = createGuest({
    name: body.name,
    organization: body.organization,
  });

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    guest: {
      ...guest,
      response: null,
      inviteUrl: `${origin}/invite/${guest.token}`,
    },
  });
}
