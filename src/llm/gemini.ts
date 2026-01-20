import { GoogleGenAI } from '@google/genai';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async review(
    diff: string,
    preset: AgentPreset,
    timeout: number = 30000
  ): Promise<ReviewResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Load preset-specific system prompt
      const systemPrompt = loadPrompt(preset);
      
      // Gemini combines system instruction with user message
      const userMessage = `${systemPrompt}\n\n---\n\nGit diff to review:\n\n\`\`\`diff\n${diff}\n\`\`\``;
      
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: userMessage,
        config: {
          responseMimeType: 'application/json',
          httpOptions: {
            timeout: timeout,
          },
        },
      });

      // Extract text from Gemini response
      // response.text concatenates all candidate text parts
      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      return this.parseResponse(text);
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseResponse(content: string): ReviewResult {
    try {
      const parsed = JSON.parse(content);
      return {
        hasIssues: parsed.hasIssues ?? false,
        issues: parsed.issues ?? [],
        summary: parsed.summary,
      };
    } catch {
      // Fail-open: if we can't parse, assume no issues
      return { hasIssues: false, issues: [] };
    }
  }
}
