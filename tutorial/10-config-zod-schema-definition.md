# 10 - Config Zod Schema Definition

**Goal:** Define Zod schemas for type-safe configuration validation.

Create `src/config.ts` with the schema:

```typescript
import { z } from 'zod';

const ProviderSchema = z.enum(['openai', 'anthropic', 'groq']);

const AgentPresetSchema = z.enum(['strict', 'balanced', 'permissive']);

const ModelsSchema = z.record(z.string()).optional();

export const ConfigSchema = z.object({
  provider: ProviderSchema.default('openai'),
  model: z.string().min(1),
  agent_preset: AgentPresetSchema.default('strict'),
  interactive: z.boolean().default(false),
  models: ModelsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type AgentPreset = z.infer<typeof AgentPresetSchema>;
```

Zod ensures config is validated and provides excellent TypeScript inference.

Next step: [11-config-loader-implementation.md](11-config-loader-implementation.md)
