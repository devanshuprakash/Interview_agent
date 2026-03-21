import fs from "fs";
import type { IAIProvider } from "../providers/ai/IAIProvider.js";
import { extractPdfText } from "../utils/pdfExtractor.js";
import { ValidationError, ExternalServiceError } from "../errors/index.js";
import type { IResumeAnalyzerService } from "./interfaces/IResumeAnalyzerService.js";

export interface ResumeAnalysisResult {
  role: string;
  experience: string;
  projects: string[];
  skills: string[];
  resumeText: string;
}

/**
 * ResumeAnalyzerService — parses a PDF resume, asks the AI to extract
 * structured fields, and returns them. Deletes the uploaded file afterward.
 */
export class ResumeAnalyzerService implements IResumeAnalyzerService {
  constructor(private readonly ai: IAIProvider) {}

  async analyze(filepath: string | undefined): Promise<ResumeAnalysisResult> {
    if (!filepath) {
      throw new ValidationError("Resume required");
    }

    try {
      const resumeText = await extractPdfText(filepath);

      const aiResponse = await this.ai.complete([
        {
          role: "system",
          content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`,
        },
        { role: "user", content: resumeText },
      ]);

      let parsed: {
        role: string;
        experience: string;
        projects: string[];
        skills: string[];
      };
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        throw new ExternalServiceError("AI returned malformed JSON");
      }

      return {
        role: parsed.role,
        experience: parsed.experience,
        projects: parsed.projects,
        skills: parsed.skills,
        resumeText,
      };
    } finally {
      if (filepath && fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch {
          // best-effort cleanup
        }
      }
    }
  }
}
