import { NextResponse } from "next/server";
import {
  getGuestByToken,
  getResponseByGuestId,
  upsertResponse,
} from "@/lib/db";
import { LUNCH_OPTIONS, type LunchChoice } from "@/lib/types";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/rsvp/[token]">,
) {
  const { token } = await context.params;
  const guest = getGuestByToken(token);
  if (!guest) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const response = getResponseByGuestId(guest.id) ?? null;
  return NextResponse.json({ guest, response });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/rsvp/[token]">,
) {
  const { token } = await context.params;
  const guest = getGuestByToken(token);
  if (!guest) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    attending?: "yes" | "no";
    lunch?: string;
    dietary?: "yes" | "no";
    dietaryDetails?: string;
  };

  if (body.attending !== "yes" && body.attending !== "no") {
    return NextResponse.json(
      { error: "Please tell us if you can attend" },
      { status: 400 },
    );
  }

  if (body.dietary !== "yes" && body.dietary !== "no") {
    return NextResponse.json(
      { error: "Please indicate dietary requirements" },
      { status: 400 },
    );
  }

  if (body.dietary === "yes" && !body.dietaryDetails?.trim()) {
    return NextResponse.json(
      { error: "Please provide dietary details" },
      { status: 400 },
    );
  }

  const lunch = (body.lunch ?? "") as LunchChoice | "";
  if (lunch && !LUNCH_OPTIONS.includes(lunch as LunchChoice)) {
    return NextResponse.json({ error: "Invalid lunch choice" }, { status: 400 });
  }

  const response = upsertResponse(guest.id, {
    attending: body.attending,
    lunch,
    dietary: body.dietary,
    dietaryDetails: body.dietary === "yes" ? body.dietaryDetails!.trim() : "",
  });

  return NextResponse.json({ response });
}
