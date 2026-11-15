import { GoogleGenAI } from '@google/genai';
import type {
  LLMProvider,
  ReviewResult,
  AgentPreset,
} from './index.js';
import type { ProviderConfig } from './factory.js';
import { loadPrompt } from '../prompts/builder.js';
import { ReviewError } from '../utils/timeout.js';

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
    try {
      // Load preset-specific system prompt
      const systemPrompt = loadPrompt(preset);
      
      // Gemini combines system instruction with user message
      // Use systemInstruction in config for better prompt structure
      const userMessage = `Git diff to review:\n\n\`\`\`diff\n${diff}\n\`\`\``;
      
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.1,
          // The SDK aborts the underlying fetch once this many ms have passed
          httpOptions: { timeout },
        },
      });

      // Extract text from Gemini response - response.text is available directly
      const text = response.text || '{}';

      return this.parseResponse(text);
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
        `Gemini review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          provider: 'gemini',
          model: this.model,
          preset,
          errorType,
          originalError: error,
        }
      );
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
      console.warn(`Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      return { hasIssues: false, issues: [] };
    }
  }
}
