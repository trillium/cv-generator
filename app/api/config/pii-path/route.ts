import { NextResponse } from "next/server";
import { join } from "path";

export async function GET() {
  const piiPath = process.env.PII_PATH || join(process.cwd(), "pii");

  return NextResponse.json({
    piiPath,
  });
}
