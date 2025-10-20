import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { MultiFileManager } from "./multiFileManager/multiFileManager";
import * as yaml from "js-yaml";

const TEST_PII_DIR = path.join(process.cwd(), "test-pii");

vi.mock("./getPiiPath", () => ({
  getPiiDirectory: () => TEST_PII_DIR,
}));

describe("MultiFileManager", () => {
  let manager: MultiFileManager;

  beforeEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_PII_DIR, { recursive: true });
    manager = new MultiFileManager();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_PII_DIR)) {
      fs.rmSync(TEST_PII_DIR, { recursive: true });
    }
  });

  describe("updatePath - file prioritization", () => {
    it("should prioritize section-specific file over full data file", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      const dataFile = path.join(resumesDir, "data.yml");
      const infoFile = path.join(resumesDir, "info.yml");

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
          workExperience: [],
        }),
      );

      fs.writeFileSync(
        infoFile,
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
        }),
      );

      await manager.updatePath("resumes", "info.firstName", "Jane");

      const dataContent = yaml.load(
        fs.readFileSync(dataFile, "utf-8"),
      ) as Record<string, unknown>;
      const infoContent = yaml.load(
        fs.readFileSync(infoFile, "utf-8"),
      ) as Record<string, unknown>;

      expect((infoContent.info as { firstName: string }).firstName).toBe(
        "Jane",
      );
      expect((dataContent.info as { firstName: string }).firstName).toBe(
        "John",
      );
    });

    it("should update full data file when no section-specific file exists", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      const dataFile = path.join(resumesDir, "data.yml");

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
          workExperience: [],
        }),
      );

      await manager.updatePath("resumes", "info.firstName", "Jane");

      const dataContent = yaml.load(
        fs.readFileSync(dataFile, "utf-8"),
      ) as Record<string, unknown>;

      expect((dataContent.info as { firstName: string }).firstName).toBe(
        "Jane",
      );
    });

    it("should update most specific directory when section exists in multiple levels", async () => {
      const baseDir = path.join(TEST_PII_DIR, "resumes");
      const googleDir = path.join(baseDir, "google");
      fs.mkdirSync(googleDir, { recursive: true });

      const baseInfoFile = path.join(baseDir, "info.yml");
      const googleInfoFile = path.join(googleDir, "info.yml");

      fs.writeFileSync(
        baseInfoFile,
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
        }),
      );

      fs.writeFileSync(
        googleInfoFile,
        yaml.dump({
          info: { firstName: "John", lastName: "Smith" },
        }),
      );

      await manager.updatePath("resumes/google", "info.firstName", "Jane");

      const baseContent = yaml.load(
        fs.readFileSync(baseInfoFile, "utf-8"),
      ) as Record<string, unknown>;
      const googleContent = yaml.load(
        fs.readFileSync(googleInfoFile, "utf-8"),
      ) as Record<string, unknown>;

      expect((googleContent.info as { firstName: string }).firstName).toBe(
        "Jane",
      );
      expect((baseContent.info as { firstName: string }).firstName).toBe(
        "John",
      );
    });

    it("should create section-specific file when section doesn't exist", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      await manager.updatePath("resumes", "info.firstName", "Jane");

      const infoFile = path.join(resumesDir, "info.yml");
      expect(fs.existsSync(infoFile)).toBe(true);

      const infoContent = yaml.load(
        fs.readFileSync(infoFile, "utf-8"),
      ) as Record<string, unknown>;
      expect(infoContent).toHaveProperty("info");
    });

    it("should handle nested path updates in section-specific file", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      const workFile = path.join(resumesDir, "work.yml");

      fs.writeFileSync(
        workFile,
        yaml.dump({
          workExperience: [
            { position: "Engineer", company: "ACME" },
            { position: "Manager", company: "ACME" },
          ],
        }),
      );

      await manager.updatePath(
        "resumes",
        "workExperience[0].position",
        "Senior Engineer",
      );

      const workContent = yaml.load(
        fs.readFileSync(workFile, "utf-8"),
      ) as Record<string, unknown>;

      expect(
        (workContent.workExperience as Array<{ position: string }>)[0].position,
      ).toBe("Senior Engineer");
    });

    it("should prioritize section-specific over full data even when both have same basename", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      const dataFile = path.join(resumesDir, "data.yml");
      const workFile = path.join(resumesDir, "work.yml");

      fs.writeFileSync(
        dataFile,
        yaml.dump({
          workExperience: [{ position: "Engineer" }],
          info: { firstName: "John" },
        }),
      );

      fs.writeFileSync(
        workFile,
        yaml.dump({
          workExperience: [{ position: "Engineer" }],
        }),
      );

      await manager.updatePath(
        "resumes",
        "workExperience[0].position",
        "Senior Engineer",
      );

      const dataContent = yaml.load(
        fs.readFileSync(dataFile, "utf-8"),
      ) as Record<string, unknown>;
      const workContent = yaml.load(
        fs.readFileSync(workFile, "utf-8"),
      ) as Record<string, unknown>;

      expect(
        (workContent.workExperience as Array<{ position: string }>)[0].position,
      ).toBe("Senior Engineer");
      expect(
        (dataContent.workExperience as Array<{ position: string }>)[0].position,
      ).toBe("Engineer");
    });
  });

  describe("loadDirectory", () => {
    it("should load and merge data from directory hierarchy", async () => {
      const baseDir = path.join(TEST_PII_DIR, "resumes");
      const googleDir = path.join(baseDir, "google");
      fs.mkdirSync(googleDir, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, "info.yml"),
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
        }),
      );

      fs.writeFileSync(
        path.join(googleDir, "work.yml"),
        yaml.dump({
          workExperience: [{ position: "Engineer" }],
        }),
      );

      const result = await manager.loadDirectory("resumes/google");

      expect(result.data).toHaveProperty("info");
      expect(result.data).toHaveProperty("workExperience");
      expect((result.data.info as { firstName: string }).firstName).toBe(
        "John",
      );
    });

    it("should track source files for each section", async () => {
      const resumesDir = path.join(TEST_PII_DIR, "resumes");
      fs.mkdirSync(resumesDir, { recursive: true });

      const infoFile = path.join(resumesDir, "info.yml");
      const workFile = path.join(resumesDir, "work.yml");

      fs.writeFileSync(infoFile, yaml.dump({ info: { firstName: "John" } }));
      fs.writeFileSync(
        workFile,
        yaml.dump({ workExperience: [{ position: "Engineer" }] }),
      );

      const result = await manager.loadDirectory("resumes");

      expect(result.sources.info).toBe(infoFile);
      expect(result.sources.workExperience).toBe(workFile);
    });

    it("should override parent directory sections with child directory sections", async () => {
      const baseDir = path.join(TEST_PII_DIR, "resumes");
      const googleDir = path.join(baseDir, "google");
      fs.mkdirSync(googleDir, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, "info.yml"),
        yaml.dump({
          info: { firstName: "John", lastName: "Doe" },
        }),
      );

      fs.writeFileSync(
        path.join(googleDir, "info.yml"),
        yaml.dump({
          info: { firstName: "Jane", lastName: "Smith" },
        }),
      );

      const result = await manager.loadDirectory("resumes/google");

      expect((result.data.info as { firstName: string }).firstName).toBe(
        "Jane",
      );
      expect((result.data.info as { lastName: string }).lastName).toBe("Smith");
    });
  });
});
