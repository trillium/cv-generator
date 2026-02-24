import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { yaml } from "@/lib/yamlService";
import { NextRequest } from "next/server";

const TEST_PII_DIR = path.join(process.cwd(), "test-pii-api");

vi.mock("@/lib/getPiiPath", () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}));

vi.mock("child_process", async () => {
  const actual =
    await vi.importActual<typeof import("child_process")>("child_process");
  return {
    ...actual,
    spawn: vi.fn(() => ({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event, callback) => {
        if (event === "close") {
          setTimeout(() => callback(0), 10);
        }
      }),
    })),
  };
});

import { POST } from "./route";
import { spawn } from "child_process";

describe("POST /api/directory/update", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_PII_DIR, { recursive: true });
    vi.mocked(spawn).mockClear();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
  });

  it("should trigger PDF generation in the directory containing the edited file", async () => {
    const baseDir = path.join(TEST_PII_DIR, "resumes");
    const facebookDir = path.join(baseDir, "facebook");
    fs.mkdirSync(facebookDir, { recursive: true });

    const baseInfoFile = path.join(baseDir, "info.yml");
    const facebookInfoFile = path.join(facebookDir, "info.yml");

    fs.writeFileSync(
      baseInfoFile,
      yaml.dump({
        info: { firstName: "John", lastName: "Doe" },
      }),
    );

    fs.writeFileSync(
      facebookInfoFile,
      yaml.dump({
        info: { firstName: "John", lastName: "Smith" },
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/directory/update",
      {
        method: "POST",
        body: JSON.stringify({
          directoryPath: "resumes/facebook",
          yamlPath: "info.firstName",
          value: "Jane",
        }),
      },
    );

    await POST(request);

    expect(spawn).toHaveBeenCalled();

    const spawnCalls = vi.mocked(spawn).mock.calls;
    const pdfCall = spawnCalls.find((call) => call[0] === "tsx");

    expect(pdfCall).toBeDefined();

    if (pdfCall) {
      const args = pdfCall[1] as string[];
      const resumePathArg = args.find((arg: string) =>
        arg.startsWith("--resumePath="),
      );

      expect(resumePathArg).toBe("--resumePath=resumes/facebook");
    }
  });

  it("should trigger PDF generation in base directory when base file is edited", async () => {
    const baseDir = path.join(TEST_PII_DIR, "resumes");
    const facebookDir = path.join(baseDir, "facebook");
    fs.mkdirSync(facebookDir, { recursive: true });

    const baseInfoFile = path.join(baseDir, "info.yml");
    const facebookInfoFile = path.join(facebookDir, "info.yml");

    fs.writeFileSync(
      baseInfoFile,
      yaml.dump({
        info: { firstName: "John", lastName: "Doe" },
      }),
    );

    fs.writeFileSync(
      facebookInfoFile,
      yaml.dump({
        info: { firstName: "John", lastName: "Smith" },
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/directory/update",
      {
        method: "POST",
        body: JSON.stringify({
          directoryPath: "resumes",
          yamlPath: "info.lastName",
          value: "Williams",
        }),
      },
    );

    await POST(request);

    expect(spawn).toHaveBeenCalled();

    const spawnCalls = vi.mocked(spawn).mock.calls;
    const pdfCall = spawnCalls.find((call) => call[0] === "tsx");

    expect(pdfCall).toBeDefined();

    if (pdfCall) {
      const args = pdfCall[1] as string[];
      const resumePathArg = args.find((arg: string) =>
        arg.startsWith("--resumePath="),
      );

      expect(resumePathArg).toBe("--resumePath=resumes");
    }
  });
});
