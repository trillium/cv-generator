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

  it("should update existing array items without creating new array entries", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const projectsFile = path.join(testDir, "projects.yml");
    const initialContent = yaml.dump({
      projects: [
        {
          name: "Massage Tracker",
          links: [
            {
              name: "GitHub",
              link: "https://github.com/trilliumsmith/massage_tracker",
            },
          ],
          lines: [
            { text: "First bullet point" },
            { text: "Second bullet point" },
          ],
        },
      ],
    });
    fs.writeFileSync(projectsFile, initialContent);

    await updatePath(
      "resumes/test-company",
      "projects[0].lines[1].text",
      "CHANGED BULLET MANUALLY IN UI",
    );

    const updatedContent = fs.readFileSync(projectsFile, "utf-8");
    const parsed = yaml.load(updatedContent) as Record<string, unknown>;

    expect(Array.isArray(parsed.projects)).toBe(true);
    expect((parsed.projects as unknown[]).length).toBe(1);

    const project = (parsed.projects as Record<string, unknown>[])[0];
    expect(project.name).toBe("Massage Tracker");
    expect(Array.isArray(project.lines)).toBe(true);
    expect((project.lines as unknown[]).length).toBe(2);

    const lines = project.lines as Array<{ text: string }>;
    expect(lines[0].text).toBe("First bullet point");
    expect(lines[1].text).toBe("CHANGED BULLET MANUALLY IN UI");

    expect(updatedContent).toContain("- name: Massage Tracker");
    expect(updatedContent).not.toContain("- lines:");
    expect(updatedContent).not.toMatch(/projects:\s+- name:.*\s+- lines:/s);
  });

  it("should handle numbered array files correctly", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const project01 = path.join(testDir, "projects.01.first.yml");
    fs.writeFileSync(
      project01,
      yaml.dump({
        projects: [
          {
            name: "First Project",
            lines: [{ text: "First bullet" }],
          },
        ],
      }),
    );

    const project05 = path.join(testDir, "projects.05.second.yml");
    fs.writeFileSync(
      project05,
      yaml.dump({
        projects: [
          {
            name: "Second Project",
            lines: [
              { text: "Second project first bullet" },
              { text: "Second project second bullet" },
            ],
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "projects[1].lines[1].text",
      "BULLET CHANGED",
    );

    const updatedContent = fs.readFileSync(project05, "utf-8");
    console.log("=== project05 AFTER UPDATE ===");
    console.log(updatedContent);
    console.log("=== END ===");

    const parsed = yaml.load(updatedContent) as Record<string, unknown>;

    expect(Array.isArray(parsed.projects)).toBe(true);
    expect((parsed.projects as unknown[]).length).toBe(1);

    const project = (parsed.projects as Record<string, unknown>[])[0];
    expect(project.name).toBe("Second Project");
    expect(Array.isArray(project.lines)).toBe(true);

    const lines = project.lines as Array<{ text: string }>;
    expect(lines.length).toBe(2);
    expect(lines[1].text).toBe("BULLET CHANGED");

    expect(updatedContent).not.toContain("  - null");
    expect(updatedContent).not.toContain("  - lines:");
  });

  it("should handle files with multiple items correctly when calculating adjustedIndex", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const project01 = path.join(testDir, "projects.01.first.yml");
    fs.writeFileSync(
      project01,
      yaml.dump({
        projects: [
          { name: "First Project", lines: [{ text: "First bullet" }] },
        ],
      }),
    );

    const project02 = path.join(testDir, "projects.02.second.yml");
    fs.writeFileSync(
      project02,
      yaml.dump({
        projects: [
          {
            name: "Second Project A",
            lines: [{ text: "Project A bullet" }],
          },
          {
            name: "Second Project B",
            lines: [{ text: "Project B bullet" }],
          },
        ],
      }),
    );

    const project03 = path.join(testDir, "projects.03.third.yml");
    fs.writeFileSync(
      project03,
      yaml.dump({
        projects: [
          {
            name: "Third Project",
            lines: [
              { text: "Third project first bullet" },
              { text: "Third project second bullet" },
            ],
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "projects[3].lines[0].text",
      "CHANGED THIRD PROJECT FIRST BULLET",
    );

    const updatedContent = fs.readFileSync(project03, "utf-8");
    console.log("=== project03 AFTER UPDATE ===");
    console.log(updatedContent);
    console.log("=== END ===");

    const parsed = yaml.load(updatedContent) as Record<string, unknown>;

    expect(Array.isArray(parsed.projects)).toBe(true);
    expect((parsed.projects as unknown[]).length).toBe(1);

    const project = (parsed.projects as Record<string, unknown>[])[0];
    expect(project.name).toBe("Third Project");
    const lines = project.lines as Array<{ text: string }>;
    expect(lines[0].text).toBe("CHANGED THIRD PROJECT FIRST BULLET");
  });

  it("should not create phantom null array items when updating nested paths in numbered files", async () => {
    const testDir = path.join(TEST_PII_DIR, "resumes", "test-company");
    fs.mkdirSync(testDir, { recursive: true });

    const project01 = path.join(testDir, "projects.01.first.yml");
    fs.writeFileSync(
      project01,
      yaml.dump({
        projects: [
          {
            name: "First Project",
            lines: [
              { text: "First bullet" },
              { text: "Second bullet" },
              { text: "Third bullet" },
            ],
          },
        ],
      }),
    );

    const project04 = path.join(testDir, "projects.04.second.yml");
    fs.writeFileSync(
      project04,
      yaml.dump({
        projects: [
          {
            name: "Massage Tracker",
            links: [
              {
                name: "GitHub",
                link: "https://github.com/trilliumsmith/massage_tracker",
              },
            ],
            lines: [
              { text: "First line of tracker project" },
              { text: "Second line of tracker project" },
              { text: "Third line of tracker project" },
            ],
          },
        ],
      }),
    );

    await updatePath(
      "resumes/test-company",
      "projects[1].lines[2].text",
      "UPDATED THIRD LINE",
    );

    const updatedContent = fs.readFileSync(project04, "utf-8");
    const parsed = yaml.load(updatedContent) as Record<string, unknown>;

    expect(Array.isArray(parsed.projects)).toBe(true);
    const projects = parsed.projects as Array<Record<string, unknown>>;
    expect(projects.length).toBe(1);

    const project = projects[0];
    expect(project.name).toBe("Massage Tracker");

    const lines = project.lines as Array<{ text: string }>;
    expect(lines.length).toBe(3);
    expect(lines[0].text).toBe("First line of tracker project");
    expect(lines[1].text).toBe("Second line of tracker project");
    expect(lines[2].text).toBe("UPDATED THIRD LINE");

    expect(lines.every((line) => line !== null)).toBe(true);
    expect(lines.every((line) => line.text !== null)).toBe(true);

    expect(updatedContent).not.toContain("null");
    expect(updatedContent).not.toContain("- lines:");
  });
});
