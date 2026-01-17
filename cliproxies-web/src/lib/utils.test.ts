import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className utility)", () => {
  it("merges class names using clsx and tailwind-merge", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe(
      "base active",
    );
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("p-4 p-2")).toBe("p-2");
  });

  it("handles conflicting Tailwind classes correctly", () => {
    // tailwind-merge resolves conflicts by keeping the last class
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("handles objects with conditional classes", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("combines multiple input types", () => {
    expect(cn("base", ["extra", { active: true, hidden: false }], "end")).toBe(
      "base extra active end",
    );
  });

  it("handles complex Tailwind class conflicts", () => {
    expect(cn("w-4 h-4 w-6")).toBe("h-4 w-6");
    expect(cn("flex flex-col")).toBe("flex flex-col");
    expect(cn("px-2 px-4 py-1")).toBe("px-4 py-1");
  });
});
