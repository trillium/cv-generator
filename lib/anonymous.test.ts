// @vitest-environment node
import { describe, it, expect } from "vitest";
import { replace } from "./anonymous";

// Simple object replacement
describe("replace", () => {
  it("replaces primitive values", () => {
    const obj = { a: 1, b: 2 };
    const newObj = { a: 10 };
    expect(replace(obj, newObj)).toEqual({ a: 10, b: 2 });
  });

  it("replaces nested objects", () => {
    const obj = { a: { b: 2, c: 3 }, d: 4 };
    const newObj = { a: { b: 20 } };
    expect(replace(obj, newObj)).toEqual({ a: { b: 20, c: 3 }, d: 4 });
  });

  it("replaces arrays", () => {
    const obj = { a: [1, 2, 3] };
    const newObj = { a: [10, 20, 30] };
    expect(replace(obj, newObj)).toEqual({ a: [10, 20, 30] });
  });

  it("handles arrays of objects of exact match", () => {
    const obj = {
      a: [{ x: 1 }, { x: 2 }],
    };
    const newObj = {
      a: [{ x: 10 }, { x: 20 }],
    };
    expect(replace(obj, newObj)).toEqual({ a: [{ x: 10 }, { x: 20 }] });
  });

  it("handles arrays of objects of differing match", () => {
    const obj = {
      a: [
        { x: 1, y: 2 },
        { x: 2, y: 3, z: 10 },
      ],
    };
    const newObj = {
      a: [{ y: 20 }, { x: 20, y: 30 }],
    };
    expect(replace(obj, newObj)).toEqual({
      a: [
        { x: 1, y: 20 },
        { x: 20, y: 30, z: 10 },
      ],
    });
  });

  it("adds new keys from newObj", () => {
    const obj = { a: 1 };
    const newObj = { a: 2, b: 3 };
    expect(replace(obj, newObj)).toEqual({ a: 2, b: 3 });
  });

  it("Chooses values from original if new is null/undefined", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const newObj = { a: null, b: undefined };
    expect(replace(obj, newObj)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("should handle the following anon", () => {
    const header = {
      name: "Trillium Smith",
      resume: [
        "Full-stack developer with a focus on front-end experience, accessibility, and modern tooling. Builder of hands-free tools and responsive client sites, from early concept to production.",
      ],
      title: ["Software Developer"],
    };
    const anon = {
      name: "Candidate Name",
    };
    const result = {
      name: "Candidate Name",
      resume: [
        "Full-stack developer with a focus on front-end experience, accessibility, and modern tooling. Builder of hands-free tools and responsive client sites, from early concept to production.",
      ],
      title: ["Software Developer"],
    };
    expect(replace(header, anon)).toEqual(result);
  });
});
