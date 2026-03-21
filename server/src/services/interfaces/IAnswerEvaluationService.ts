export interface EvaluateAnswerDto {
  interviewId: string;
  questionIndex: number;
  answer: string;
  timeTaken: number;
}

export interface IAnswerEvaluationService {
  evaluate(dto: EvaluateAnswerDto): Promise<{ feedback: string }>;
}
