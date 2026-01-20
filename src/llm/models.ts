/**
 * Model validation schemas per provider
 */

import { z } from 'zod';

// Common model name pattern
const ModelNameSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/);

// OpenAI models (common ones)
export const OpenAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o1-preview',
  'o1-mini',
] as const;

// Anthropic models (common ones)
export const Anthropic_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const;

// Gemini models (common ones)
export const Gemini_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
] as const;

export const OpenAI_MODEL_SCHEMA = z.enum(OpenAI_MODELS).or(ModelNameSchema);
export const Anthropic_MODEL_SCHEMA = z.enum(Anthropic_MODELS).or(ModelNameSchema);
export const Gemini_MODEL_SCHEMA = z.enum(Gemini_MODELS).or(ModelNameSchema);

/**
 * Validate model name for a provider
 * @param provider The LLM provider
 * @param model The model name to validate
 * @returns true if valid, false otherwise
 */
export function validateModel(provider: 'openai' | 'anthropic' | 'gemini', model: string): boolean {
  try {
    switch (provider) {
      case 'openai':
        OpenAI_MODEL_SCHEMA.parse(model);
        return true;
      case 'anthropic':
        Anthropic_MODEL_SCHEMA.parse(model);
        return true;
      case 'gemini':
        Gemini_MODEL_SCHEMA.parse(model);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get suggested models for a provider
 */
export function getSuggestedModels(provider: 'openai' | 'anthropic' | 'gemini'): readonly string[] {
  switch (provider) {
    case 'openai':
      return OpenAI_MODELS;
    case 'anthropic':
      return Anthropic_MODELS;
    case 'gemini':
      return Gemini_MODELS;
  }
}

/**
 * Warn if model might not be supported
 */
export function warnIfModelUnknown(provider: 'openai' | 'anthropic' | 'gemini', model: string): string | null {
  const suggestedModels = getSuggestedModels(provider);
  
  if (!suggestedModels.includes(model as any)) {
    return `Model "${model}" is not in the known ${provider} models list. ` +
           `Common models: ${suggestedModels.slice(0, 3).join(', ')}...`;
  }
  
  return null;
}