import type { ResumeAnalysisResult } from "../ResumeAnalyzerService.js";

export interface IResumeAnalyzerService {
  analyze(filepath: string | undefined): Promise<ResumeAnalysisResult>;
}
