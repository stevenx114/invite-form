import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createGuest,
  getResponseByGuestId,
  listGuests,
} from "@/lib/db";
import { getAppOrigin } from "@/lib/origin";

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = getAppOrigin(request);
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

  const origin = getAppOrigin(request);
  return NextResponse.json({
    guest: {
      ...guest,
      response: null,
      inviteUrl: `${origin}/invite/${guest.token}`,
    },
  });
}
