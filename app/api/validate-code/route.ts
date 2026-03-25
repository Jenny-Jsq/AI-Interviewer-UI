import { NextResponse } from "next/server";
import { validateAccessCode } from "../../../lib/accessCode";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };

  if (!body.code) {
    return NextResponse.json({ valid: false, remainingUses: 0, message: "Missing code" }, { status: 400 });
  }

  const result = await validateAccessCode(body.code);
  return NextResponse.json({
    valid: result.valid,
    remainingUses: result.remainingUses,
    message: result.reason,
  });
}
