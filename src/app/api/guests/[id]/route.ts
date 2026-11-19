import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteGuest } from "@/lib/db";

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
