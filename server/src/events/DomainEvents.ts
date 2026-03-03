/** Domain event raised when an interview is finished. */
export interface InterviewFinishedEvent {
  readonly type: "interview.finished";
  readonly interviewId: string;
  readonly userId: string;
  readonly finalScore: number;
}

/** Domain event raised when a payment is verified successfully. */
export interface PaymentVerifiedEvent {
  readonly type: "payment.verified";
  readonly userId: string;
  readonly orderId: string;
  readonly credits: number;
}

export type DomainEvent = InterviewFinishedEvent | PaymentVerifiedEvent;
