import OpenAI from 'openai';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
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
      
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `\`\`\`diff\n${diff}\n\`\`\`` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      return this.parseResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
