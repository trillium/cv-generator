import { NextRequest } from "next/server";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const {
    mode = "prod",
    resumePath,
    resumeType = "single-column",
    print = ["resume", "cover"],
  } = await req.json();

  const args = ["pdf", `--${mode}`, `--resumeType=${resumeType}`];

  if (resumePath) {
    args.push(`--resumePath=${resumePath}`);
  }

  if (print.length > 0) {
    args.push(`--print=${print.join(",")}`);
  }

  console.log(`📄 Triggering PDF generation: pnpm ${args.join(" ")}`);

  const child = spawn("pnpm", args, {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return Response.json(
    {
      message: "PDF generation triggered",
      mode,
      resumeType,
      resumePath,
    },
    { status: 202 },
  );
}
