import { describe, it, expect, vi, beforeEach } from "vitest";
import { InterviewService } from "../../../src/services/InterviewService.js";
import type { IInterviewRepository } from "../../../src/repositories/interfaces/IInterviewRepository.js";
import type { IAIProvider } from "../../../src/providers/ai/IAIProvider.js";
import type { InterviewStrategyFactory } from "../../../src/strategies/InterviewStrategyFactory.js";
import type { ICreditService } from "../../../src/services/interfaces/ICreditService.js";
import type { IAnswerEvaluationService } from "../../../src/services/interfaces/IAnswerEvaluationService.js";
import { NotFoundError, ExternalServiceError } from "../../../src/errors/index.js";
import { makeInterview } from "../../fixtures/builders.js";
import mongoose from "mongoose";

const mockInterviewRepo = (): IInterviewRepository => ({
  findById: vi.fn(),
  createInterview: vi.fn(),
  listByUserSorted: vi.fn(),
});
const mockAI = (): IAIProvider => ({ complete: vi.fn() });
const mockFactory = () => ({
  for: vi.fn().mockReturnValue({
    buildQuestionPrompt: vi.fn().mockReturnValue([]),
    parseQuestions: vi.fn().mockReturnValue([
      { question: "Q1", difficulty: "easy", timeLimit: 60 },
      { question: "Q2", difficulty: "medium", timeLimit: 90 },
    ]),
  }),
}) as unknown as InterviewStrategyFactory;
const mockCredits = (): ICreditService => ({
  debit: vi.fn().mockResolvedValue({ creditsLeft: 150 }),
  refund: vi.fn(),
  grant: vi.fn(),
});
const mockEvaluator = (): IAnswerEvaluationService => ({
  evaluate: vi.fn().mockResolvedValue({ feedback: "Nice work." }),
});

describe("InterviewService", () => {
  let interviewRepo: ReturnType<typeof mockInterviewRepo>;
  let ai: ReturnType<typeof mockAI>;
  let factory: InterviewStrategyFactory;
  let credits: ReturnType<typeof mockCredits>;
  let evaluator: ReturnType<typeof mockEvaluator>;
  let sut: InterviewService;

  beforeEach(() => {
    interviewRepo = mockInterviewRepo();
    ai = mockAI();
    factory = mockFactory();
    credits = mockCredits();
    evaluator = mockEvaluator();
    sut = new InterviewService(interviewRepo, ai, factory, credits, evaluator, 50);
  });

  describe("createInterview", () => {
    it("debits credits and returns interview result", async () => {
      vi.mocked(ai.complete).mockResolvedValue("Q1\nQ2");
      const interview = makeInterview();
      vi.mocked(interviewRepo.createInterview).mockResolvedValue(interview);

      const result = await sut.createInterview("uid", {
        role: "Engineer", experience: "2y", mode: "Technical",
      });

      expect(credits.debit).toHaveBeenCalledWith("uid", 50);
      expect(result.interviewId).toBe(interview._id.toString());
    });

    it("refunds credits when AI returns empty response", async () => {
      vi.mocked(ai.complete).mockResolvedValue("");

      await expect(
        sut.createInterview("uid", { role: "Eng", experience: "1y", mode: "HR" }),
      ).rejects.toThrow(ExternalServiceError);

      expect(credits.refund).toHaveBeenCalledWith("uid", 50);
    });

    it("refunds credits when AI throws", async () => {
      vi.mocked(ai.complete).mockRejectedValue(new Error("AI down"));

      await expect(
        sut.createInterview("uid", { role: "Eng", experience: "1y", mode: "HR" }),
      ).rejects.toThrow("AI down");

      expect(credits.refund).toHaveBeenCalledWith("uid", 50);
    });
  });

  describe("finishInterview", () => {
    it("throws NotFoundError when interview missing", async () => {
      vi.mocked(interviewRepo.findById).mockResolvedValue(null);
      await expect(sut.finishInterview("bad-id")).rejects.toThrow(NotFoundError);
    });

    it("sets status to completed and returns aggregated scores", async () => {
      const interview = makeInterview({
        questions: [{
          question: "Q", difficulty: "easy", timeLimit: 60,
          answer: "A", feedback: "ok", score: 8,
          confidence: 7, communication: 8, correctness: 9,
        }],
      });
      vi.mocked(interviewRepo.findById).mockResolvedValue(interview);

      const result = await sut.finishInterview("id");
      expect(interview.status).toBe("completed");
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("listMine", () => {
    it("delegates to repository", async () => {
      const interviews = [makeInterview()];
      vi.mocked(interviewRepo.listByUserSorted).mockResolvedValue(interviews);

      const result = await sut.listMine("uid");
      expect(result).toBe(interviews);
    });
  });

  describe("getReport", () => {
    it("throws NotFoundError when interview missing", async () => {
      vi.mocked(interviewRepo.findById).mockResolvedValue(null);
      await expect(sut.getReport("bad-id")).rejects.toThrow(NotFoundError);
    });

    it("returns report with aggregated scores", async () => {
      const interview = makeInterview({ finalScore: 7 });
      vi.mocked(interviewRepo.findById).mockResolvedValue(interview);

      const result = await sut.getReport("id");
      expect(result.finalScore).toBe(7);
    });
  });
});
