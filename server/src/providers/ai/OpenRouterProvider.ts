import axios, { AxiosError } from "axios";
import type { AIMessage, IAIProvider } from "./IAIProvider.js";
import { ExternalServiceError } from "../../errors/index.js";

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * OpenRouterProvider — adapter implementing IAIProvider over OpenRouter's
 * OpenAI-compatible chat-completions API.
 */
export class OpenRouterProvider implements IAIProvider {
  private readonly endpoint = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly apiKey: string,
    private readonly model = "openai/gpt-4o-mini",
  ) {}

  async complete(messages: AIMessage[]): Promise<string> {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ExternalServiceError("Messages array is empty.");
    }

    try {
      const response = await axios.post<OpenRouterResponse>(
        this.endpoint,
        {
          model: this.model,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const content = response?.data?.choices?.[0]?.message?.content;

      if (!content || !content.trim()) {
        throw new ExternalServiceError("AI returned empty response.");
      }

      return content;
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const axiosErr = error as AxiosError;
      console.error(
        "OpenRouter Error:",
        axiosErr.response?.data || axiosErr.message,
      );
      throw new ExternalServiceError("OpenRouter API Error");
    }
  }
}
