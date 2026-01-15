import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const TEST_PII_DIR = path.join(process.cwd(), "test-pii-updatepath");

vi.mock("@/lib/getPiiPath", () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}));

import { updatePath } from "./updatePath";

describe("updatePath YAML array syntax", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_PII_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
  });

  it("should write arrays with dash syntax, not numeric object keys", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const workFile = path.join(testDir, "work.yml");
    fs.writeFileSync(
      workFile,
      yaml.dump({
        workExperience: [],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "workExperience[0].position",
      "Software Developer",
    );

    const updatedContent = fs.readFileSync(workFile, "utf-8");

    expect(updatedContent).toContain("\n  - position:");
    expect(updatedContent).not.toContain("'0':");
    expect(updatedContent).not.toContain("0:");
  });

  it("should preserve dash syntax when updating existing array items", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const workFile = path.join(testDir, "work.yml");
    fs.writeFileSync(
      workFile,
      yaml.dump({
        workExperience: [
          {
            position: "Junior Developer",
            location: "Remote",
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "workExperience[0].position",
      "Senior Developer",
    );

    const updatedContent = fs.readFileSync(workFile, "utf-8");

    expect(updatedContent).toContain("- position: Senior Developer");
    expect(updatedContent).toContain("location: Remote");
    expect(updatedContent).not.toContain("'0':");
    expect(updatedContent).not.toContain("0:");
  });

  it("should write nested arrays with dash syntax", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const workFile = path.join(testDir, "work.yml");
    fs.writeFileSync(
      workFile,
      yaml.dump({
        workExperience: [
          {
            position: "Software Developer",
            details: [],
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "workExperience[0].details[0].subhead",
      "HackForLA",
    );

    const updatedContent = fs.readFileSync(workFile, "utf-8");

    expect(updatedContent).toMatch(/workExperience:\s+- position:/);
    expect(updatedContent).toMatch(/details:\s+- subhead:/);
    expect(updatedContent).not.toContain("'0':");
    expect(updatedContent).not.toContain("'1':");
    expect(updatedContent).not.toContain("0:");
  });

  it("should handle 3-level nested arrays like work experience structure", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const workFile = path.join(testDir, "work.yml");
    fs.writeFileSync(
      workFile,
      yaml.dump({
        workExperience: [
          {
            position: "Software Developer",
            details: [
              {
                subhead: "HackForLA",
                lines: [],
              },
            ],
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "workExperience[0].details[0].lines[0].text",
      "Reduced CSS bugs by 30%",
    );

    const updatedContent = fs.readFileSync(workFile, "utf-8");

    expect(updatedContent).toMatch(/workExperience:\s+- position:/);
    expect(updatedContent).toMatch(/details:\s+- subhead:/);
    expect(updatedContent).toMatch(/lines:\s+- text:/);
    expect(updatedContent).not.toContain("'0':");
    expect(updatedContent).not.toContain("0:");
  });

  it("should create arrays when setting array index on missing parent structure", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const infoFile = path.join(testDir, "info.yml");
    fs.writeFileSync(
      infoFile,
      yaml.dump({
        info: {
          firstName: "John",
          lastName: "Doe",
        },
      }),
    );

    await updatePath(
      "resumes/test-company",
      "workExperience[0].position",
      "Software Developer",
    );

    const workFile = path.join(testDir, "work.yml");
    expect(fs.existsSync(workFile)).toBe(true);

    const updatedContent = fs.readFileSync(workFile, "utf-8");

    expect(updatedContent).toMatch(/workExperience:\s+- position:/);
    expect(updatedContent).not.toContain("'0':");
    expect(updatedContent).not.toContain("0:");
  });
});
