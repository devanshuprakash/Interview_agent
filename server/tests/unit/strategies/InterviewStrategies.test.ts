import { describe, it, expect } from "vitest";
import { HRInterviewStrategy } from "../../../src/strategies/HRInterviewStrategy.js";
import { TechnicalInterviewStrategy } from "../../../src/strategies/TechnicalInterviewStrategy.js";
import { BehavioralInterviewStrategy } from "../../../src/strategies/BehavioralInterviewStrategy.js";

const input = {
  role: "Engineer",
  experience: "2 years",
  mode: "Technical" as const,
  projects: ["App"],
  skills: ["Node"],
  resumeText: "CV text",
};

describe("HR Strategy", () => {
  const sut = new HRInterviewStrategy();
  it("has mode HR", () => expect(sut.mode).toBe("HR"));
  it("builds a question prompt with two messages", () => {
    expect(sut.buildQuestionPrompt({ ...input, mode: "HR" })).toHaveLength(2);
  });
  it("parses up to 5 questions from raw line-by-line text", () => {
    const raw = "Q1\nQ2\nQ3\nQ4\nQ5\nQ6";
    expect(sut.parseQuestions(raw)).toHaveLength(5);
  });
  it("returns scoring weights summing to 1", () => {
    const w = sut.scoringWeights();
    expect(w.confidence + w.communication + w.correctness).toBeCloseTo(1);
  });
});

describe("Technical Strategy", () => {
  const sut = new TechnicalInterviewStrategy();
  it("has mode Technical", () => expect(sut.mode).toBe("Technical"));
  it("weights correctness highest", () => {
    const w = sut.scoringWeights();
    expect(w.correctness).toBeGreaterThan(w.communication);
  });
});

describe("Behavioral Strategy (OCP extension)", () => {
  const sut = new BehavioralInterviewStrategy();
  it("has mode Behavioral", () => expect(sut.mode).toBe("Behavioral"));
  it("builds scoring prompt messages", () => {
    expect(sut.buildScoringPrompt("Tell me about a challenge", "I faced X...")).toHaveLength(2);
  });
  it("weights communication highest", () => {
    const w = sut.scoringWeights();
    expect(w.communication).toBeGreaterThan(w.correctness);
    expect(w.communication).toBeGreaterThan(w.confidence);
  });
});
