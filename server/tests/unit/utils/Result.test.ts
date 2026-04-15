import { describe, it, expect } from "vitest";
import { ok, err, Ok, Err } from "../../../src/utils/Result.js";

describe("Result<T,E>", () => {
  describe("Ok", () => {
    it("ok is true", () => expect(ok(42).ok).toBe(true));
    it("unwrap returns value", () => expect(ok("hello").unwrap()).toBe("hello"));
    it("map transforms value", () => expect(ok(2).map((v) => v * 3).unwrap()).toBe(6));
    it("mapErr is a no-op", () => expect(ok(1).mapErr(() => "boom").ok).toBe(true));
    it("unwrapOr returns value not fallback", () => expect(ok(5).unwrapOr(99)).toBe(5));
  });

  describe("Err", () => {
    it("ok is false", () => expect(err("oops").ok).toBe(false));
    it("unwrap throws the error", () => expect(() => err(new Error("fail")).unwrap()).toThrow("fail"));
    it("map is a no-op", () => expect(err("e").map(() => 1).ok).toBe(false));
    it("mapErr transforms error", () => {
      const result = err("original").mapErr((e) => `wrapped: ${e}`);
      expect(result.ok).toBe(false);
      expect((result as Err<string>).error).toBe("wrapped: original");
    });
    it("unwrapOr returns fallback", () => expect(err("e").unwrapOr(42)).toBe(42));
  });
});
