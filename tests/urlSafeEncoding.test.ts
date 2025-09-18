import {
  encodeFilePathForUrl,
  decodeFilePathFromUrl,
} from "../src/utils/urlSafeEncoding";

describe("urlSafeEncoding", () => {
  it("encodes file path correctly", () => {
    const input = "resumes/software-engineer/data.yml";
    const expected = "resumes-slash-software-engineer-slash-data.yml";
    expect(encodeFilePathForUrl(input)).toBe(expected);
  });

  it("decodes file path correctly", () => {
    const input = "resumes-slash-software-engineer-slash-data.yml";
    const expected = "resumes/software-engineer/data.yml";
    expect(decodeFilePathFromUrl(input)).toBe(expected);
  });

  it("handles empty string", () => {
    expect(encodeFilePathForUrl("")).toBe("");
    expect(decodeFilePathFromUrl("")).toBe("");
  });

  it("handles path with hyphens correctly", () => {
    const input = "resumes/soft-ware-engineer/data.yml";
    const encoded = encodeFilePathForUrl(input);
    const decoded = decodeFilePathFromUrl(encoded);
    expect(decoded).toBe(input);
  });
});
