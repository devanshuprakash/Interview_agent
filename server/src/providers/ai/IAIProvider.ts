export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * IAIProvider — adapter interface for LLM completion backends.
 * Implementations: OpenRouterProvider (current), OpenAIProvider, etc.
 */
export interface IAIProvider {
  complete(messages: AIMessage[]): Promise<string>;
}
