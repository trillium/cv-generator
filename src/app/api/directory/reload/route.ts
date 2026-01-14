import { NextRequest, NextResponse } from "next/server";
import { rebuildPdfs } from "@/lib/pdfRebuilder";
import type { PdfType } from "@/lib/pdfSectionMapper";

interface ReloadPayload {
  path: string;
  type: "change" | "add" | "unlink";
  timestamp: number;
}

const subscribers = new Set<ReadableStreamDefaultController>();

export async function POST(request: NextRequest) {
  try {
    const payload: ReloadPayload = await request.json();

    console.log(`[Reload] Received notification:`, payload);

    const directoryPath = payload.path.includes("/")
      ? `resumes/${payload.path.substring(0, payload.path.lastIndexOf("/"))}`
      : "resumes";

    console.log(`[Reload] Extracted directory path: ${directoryPath}`);

    if (payload.type !== "unlink" && directoryPath) {
      console.log(`[Reload] Triggering PDF rebuild for: ${directoryPath}`);

      const pdfsToRegenerate: PdfType[] = ["resume", "cover"];

      rebuildPdfs(directoryPath, pdfsToRegenerate).catch((err) => {
        console.error(`[Reload] PDF rebuild failed:`, err);
      });
    }

    const message = `data: ${JSON.stringify(payload)}\n\n`;

    subscribers.forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch (err) {
        console.error(`[Reload] Failed to send to subscriber:`, err);
        subscribers.delete(controller);
      }
    });

    return NextResponse.json({
      success: true,
      subscribers: subscribers.size,
      payload,
    });
  } catch (error) {
    console.error("[Reload] Error handling reload notification:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process reload",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      subscribers.add(controller);
      console.log(
        `[Reload] New subscriber connected (total: ${subscribers.size})`,
      );

      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: "connected" })}\n\n`,
        ),
      );

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
          subscribers.delete(controller);
        }
      }, 30000);

      return () => {
        clearInterval(keepAlive);
        subscribers.delete(controller);
        console.log(
          `[Reload] Subscriber disconnected (total: ${subscribers.size})`,
        );
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
