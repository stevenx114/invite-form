import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteGuest, updateGuestEmail } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/guests/[id]">,
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = deleteGuest(id);
  if (!deleted) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/guests/[id]">,
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim() ?? "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const guest = updateGuestEmail(id, email);
  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, email: guest.email ?? "" });
}
