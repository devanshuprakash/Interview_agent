export interface ICreditService {
  debit(userId: string, cost: number): Promise<{ creditsLeft: number }>;
  refund(userId: string, cost: number): Promise<void>;
  grant(userId: string, amount: number): Promise<void>;
}
