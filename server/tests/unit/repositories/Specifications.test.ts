import { describe, it, expect } from "vitest";
import { ByUserIdSpec, FinishedSpec, ScoreAboveSpec } from "../../../src/repositories/specs/InterviewSpecs.js";

describe("Specifications", () => {
  describe("ByUserIdSpec", () => {
    it("generates a userId filter", () => {
      const spec = new ByUserIdSpec("user-1");
      expect(spec.toQuery()).toEqual({ userId: "user-1" });
    });
  });

  describe("FinishedSpec", () => {
    it("generates a completed status filter", () => {
      expect(new FinishedSpec().toQuery()).toEqual({ status: "completed" });
    });
  });

  describe("ScoreAboveSpec", () => {
    it("generates a $gte filter on finalScore", () => {
      expect(new ScoreAboveSpec(7).toQuery()).toEqual({ finalScore: { $gte: 7 } });
    });
  });

  describe("Composition", () => {
    it(".and() produces $and query", () => {
      const q = new ByUserIdSpec("u1").and(new FinishedSpec()).toQuery();
      expect(q).toHaveProperty("$and");
      expect((q.$and as unknown[]).length).toBe(2);
    });

    it(".or() produces $or query", () => {
      const q = new ByUserIdSpec("u1").or(new FinishedSpec()).toQuery();
      expect(q).toHaveProperty("$or");
    });

    it(".not() produces $nor query", () => {
      const q = new FinishedSpec().not().toQuery();
      expect(q).toHaveProperty("$nor");
    });
  });
});
