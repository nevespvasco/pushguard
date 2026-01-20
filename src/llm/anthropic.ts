import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
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
      
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: `\`\`\`diff\n${diff}\n\`\`\`` },
          ],
        },
        { signal: controller.signal }
      );

      // Extract text from Anthropic response (content is array of content blocks)
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as Anthropic.TextBlock).text)
        .join('');

      return this.parseResponse(text || '{}');
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
