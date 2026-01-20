import OpenAI from 'openai';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';
import { ReviewError } from '../utils/timeout.js';

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

      return this.parseResponse(response.choices[0]?.message?.content || '{}');
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
        `OpenAI review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          provider: 'openai',
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
      console.warn(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      return { hasIssues: false, issues: [] };
    }
  }
}
