import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResumeAnalyzerService } from "../../../src/services/ResumeAnalyzerService.js";
import type { IAIProvider } from "../../../src/providers/ai/IAIProvider.js";
import { ValidationError, ExternalServiceError } from "../../../src/errors/index.js";
import * as pdfExtractor from "../../../src/utils/pdfExtractor.js";
import fs from "fs";

vi.mock("fs");
vi.mock("../../../src/utils/pdfExtractor.js");

const mockAI = (): IAIProvider => ({ complete: vi.fn() });

const goodAIResponse = JSON.stringify({
  role: "Software Engineer",
  experience: "3 years",
  projects: ["E-commerce site"],
  skills: ["TypeScript", "Node.js"],
});

describe("ResumeAnalyzerService", () => {
  let ai: ReturnType<typeof mockAI>;
  let sut: ResumeAnalyzerService;

  beforeEach(() => {
    ai = mockAI();
    sut = new ResumeAnalyzerService(ai);
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  it("throws ValidationError when no filepath provided", async () => {
    await expect(sut.analyze(undefined)).rejects.toThrow(ValidationError);
  });

  it("extracts resume and parses AI response", async () => {
    vi.mocked(pdfExtractor.extractPdfText).mockResolvedValue("resume text");
    vi.mocked(ai.complete).mockResolvedValue(goodAIResponse);

    const result = await sut.analyze("/uploads/resume.pdf");

    expect(result.role).toBe("Software Engineer");
    expect(result.experience).toBe("3 years");
    expect(result.skills).toContain("TypeScript");
    expect(result.resumeText).toBe("resume text");
  });

  it("throws ExternalServiceError when AI returns invalid JSON", async () => {
    vi.mocked(pdfExtractor.extractPdfText).mockResolvedValue("resume text");
    vi.mocked(ai.complete).mockResolvedValue("not-json");

    await expect(sut.analyze("/uploads/resume.pdf")).rejects.toThrow(ExternalServiceError);
  });

  it("deletes the uploaded file in the finally block", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.unlinkSync).mockImplementation(() => {});
    vi.mocked(pdfExtractor.extractPdfText).mockResolvedValue("text");
    vi.mocked(ai.complete).mockResolvedValue(goodAIResponse);

    await sut.analyze("/uploads/resume.pdf");

    expect(fs.unlinkSync).toHaveBeenCalledWith("/uploads/resume.pdf");
  });
});
