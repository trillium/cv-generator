import { NextRequest } from "next/server";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  // TODO: Add authentication/authorization for admin use

  // Accept options in body (future: dataPath, resumeType, etc)
  // const { dataPath, resumeType, resumePath, anon, print } = await req.json();

  // Spawn 'pnpm pdf' as a detached child process
  console.log("[req]", req);

  const child = spawn("pnpm", ["pdf"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return new Response(
    JSON.stringify({ message: "PDF build triggered via pnpm pdf" }),
    { status: 202, headers: { "Content-Type": "application/json" } },
  );
}
