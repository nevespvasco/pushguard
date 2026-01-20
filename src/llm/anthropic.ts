import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';
import { ReviewError } from '../utils/timeout.js';

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
      // Determine error type
      let errorType: 'timeout' | 'api' | 'parse' | 'unknown' = 'unknown';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorType = 'timeout';
        } else if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
          errorType = 'api';
        }
      }
      
      // Wrap error with context
      throw new ReviewError(
        `Anthropic review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          provider: 'anthropic',
          model: this.model,
          preset,
          errorType,
          originalError: error,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseResponse(content: string): ReviewResult {
    try {
      const parsed = JSON.parse(content);
      
      // Validate structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid response format: not an object');
      }
      
      // Ensure issues is an array
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
      
      // Validate each issue has required fields
      const validatedIssues = issues.filter((issue: unknown) => {
        return (
          typeof issue === 'object' &&
          issue !== null &&
          'severity' in issue &&
          'message' in issue &&
          typeof (issue as { message: unknown }).message === 'string'
        );
      });
      
      return {
        hasIssues: parsed.hasIssues === true && validatedIssues.length > 0,
        issues: validatedIssues,
        summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
      };
    } catch (parseError) {
      // Fail-open: if we can't parse, assume no issues but log warning
      console.warn(`Failed to parse Anthropic response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      return { hasIssues: false, issues: [] };
    }
  }
}
