import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnswerEvaluationService } from "../../../src/services/AnswerEvaluationService.js";
import type { IInterviewRepository } from "../../../src/repositories/interfaces/IInterviewRepository.js";
import type { IAIProvider } from "../../../src/providers/ai/IAIProvider.js";
import type { InterviewStrategyFactory } from "../../../src/strategies/InterviewStrategyFactory.js";
import { NotFoundError, ExternalServiceError } from "../../../src/errors/index.js";
import { makeInterview } from "../../fixtures/builders.js";

const mockInterviewRepo = (): IInterviewRepository => ({
  findById: vi.fn(),
  createInterview: vi.fn(),
  listByUserSorted: vi.fn(),
});
const mockAI = (): IAIProvider => ({ complete: vi.fn() });
const mockFactory = () => ({
  for: vi.fn().mockReturnValue({
    buildScoringPrompt: vi.fn().mockReturnValue([]),
  }),
}) as unknown as InterviewStrategyFactory;

const goodScore = JSON.stringify({
  confidence: 8, communication: 7, correctness: 9,
  finalScore: 8, feedback: "Good structured answer.",
});

describe("AnswerEvaluationService", () => {
  let repo: ReturnType<typeof mockInterviewRepo>;
  let ai: ReturnType<typeof mockAI>;
  let factory: InterviewStrategyFactory;
  let sut: AnswerEvaluationService;

  beforeEach(() => {
    repo = mockInterviewRepo();
    ai = mockAI();
    factory = mockFactory();
    sut = new AnswerEvaluationService(repo, ai, factory);
  });

  it("throws NotFoundError when interview missing", async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);
    await expect(sut.evaluate({ interviewId: "x", questionIndex: 0, answer: "ans", timeTaken: 30 }))
      .rejects.toThrow(NotFoundError);
  });

  it("returns 'no answer' feedback when answer is empty", async () => {
    const interview = makeInterview();
    vi.mocked(repo.findById).mockResolvedValue(interview);

    const result = await sut.evaluate({ interviewId: "x", questionIndex: 0, answer: "", timeTaken: 30 });
    expect(result.feedback).toContain("did not submit");
  });

  it("returns time-exceeded feedback when timeTaken exceeds limit", async () => {
    const interview = makeInterview();
    vi.mocked(repo.findById).mockResolvedValue(interview);

    const result = await sut.evaluate({ interviewId: "x", questionIndex: 0, answer: "some", timeTaken: 9999 });
    expect(result.feedback).toContain("Time limit exceeded");
  });

  it("evaluates answer via AI and returns feedback", async () => {
    const interview = makeInterview();
    vi.mocked(repo.findById).mockResolvedValue(interview);
    vi.mocked(ai.complete).mockResolvedValue(goodScore);

    const result = await sut.evaluate({ interviewId: "x", questionIndex: 0, answer: "closures capture scope", timeTaken: 30 });
    expect(result.feedback).toBe("Good structured answer.");
  });

  it("throws ExternalServiceError when AI returns malformed JSON", async () => {
    const interview = makeInterview();
    vi.mocked(repo.findById).mockResolvedValue(interview);
    vi.mocked(ai.complete).mockResolvedValue("not json");

    await expect(sut.evaluate({ interviewId: "x", questionIndex: 0, answer: "ans", timeTaken: 30 }))
      .rejects.toThrow(ExternalServiceError);
  });
});
