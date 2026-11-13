---
name: genkit
description: >-
  Official Firebase Genkit AI skill for developing AI-powered workflows,
  structured outputs with Zod, and multi-agent flows using Google Gemini models
  (Gemini 3.8 Flash, Gemini 3.5 Flash, Gemini 2.5 Flash, Gemini 2.0 Flash) in
  NestJS and TypeScript backends.
---

# Firebase Genkit AI Integration Guide

This skill provides best practices, architectural patterns, and code snippets for integrating Firebase Genkit with Google Gemini models into TypeScript & NestJS enterprise applications.

## 1. Overview & Setup

Genkit provides a unified runtime for generative AI workflows, structured schemas, model calling, and observability.

### Dependencies
```json
{
  "dependencies": {
    "genkit": "^1.44.0",
    "@genkit-ai/google-genai": "^1.44.0",
    "zod": "^3.24.0"
  }
}
```

### Environment Configuration
Ensure your environment provides:
- `GEMINI_API_KEY`: API key from Google AI Studio.
- `GEMINI_MODEL`: Model name (e.g. `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-3.8-flash`).

## 2. Initializing Genkit with Gemini

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env['GEMINI_API_KEY'] || process.env['GOOGLE_GENAI_API_KEY'],
    }),
  ],
});
```

## 3. Defining Structured Genkit Flows

Use `ai.defineFlow` to encapsulate business logic, structured output validation with Zod schemas, and error handling.

### Example: Sales Funnel Generator Flow
```typescript
import { z } from 'zod';
import { ai } from './genkit.config';

export const FunnelStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['optin', 'sales', 'checkout', 'upsell', 'downsell', 'thankyou', 'webinar']),
  headline: z.string(),
  subheadline: z.string(),
  callToAction: z.string(),
  keyBenefits: z.array(z.string()),
  copyDraft: z.string(),
  orderBump: z.object({
    title: z.string(),
    price: z.number(),
    description: z.string(),
  }).optional(),
});

export const GeneratedFunnelSchema = z.object({
  title: z.string(),
  targetNiche: z.string(),
  valueProposition: z.string(),
  recommendedPricingStrategy: z.string(),
  steps: z.array(FunnelStepSchema),
  conversionTactics: z.array(z.string()),
});

export const generateFunnelFlow = ai.defineFlow(
  {
    name: 'generateFunnelFlow',
    inputSchema: z.object({
      productName: z.string(),
      niche: z.string(),
      offerType: z.string(),
      targetAudience: z.string(),
      pricePoint: z.string(),
      keyBenefits: z.string(),
    }),
    outputSchema: GeneratedFunnelSchema,
  },
  async (input) => {
    const prompt = `You are a world-class direct-response funnel strategist and copywriter like Russell Brunson.
Create a complete high-converting sales funnel for:
- Product/Service: ${input.productName}
- Target Niche: ${input.niche}
- Offer Type: ${input.offerType}
- Target Audience: ${input.targetAudience}
- Target Price: ${input.pricePoint}
- Key Benefits: ${input.keyBenefits}

Generate a multi-step sequence (Opt-in Lead Magnet, Sales Page, Checkout with Order Bump, One-Time Offer Upsell, and Thank You Page) with irresistible hooks, bulletproof objection handling, and clear CTAs.`;

    const response = await ai.generate({
      model: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
      prompt,
      output: { schema: GeneratedFunnelSchema },
    });

    return response.output;
  }
);
```

## 4. Copywriting and CRO Audit Flows

### High-Converting Copywriter Flow
- Frameworks: AIDA (Attention, Interest, Desire, Action), PAS (Problem, Agitate, Solve), BAB (Before, After, Bridge).
- Outputs variants for A/B testing.

### CRO Page Auditor Flow
- Evaluates clarity, headline hook, friction, visual hierarchy, urgency, and social proof.
- Returns a numerical score (0-100) and actionable bulleted suggestions.

## 5. NestJS Integration Pattern

Wrap Genkit flows inside NestJS injectable services:

```typescript
@Injectable()
export class AiService {
  async generateFunnel(dto: GenerateFunnelDto) {
    return await generateFunnelFlow(dto);
  }
  
  async rewriteCopy(dto: RewriteCopyDto) {
    return await copywriterFlow(dto);
  }

  async auditPage(dto: AuditPageDto) {
    return await croAuditFlow(dto);
  }
}
```

Include fallback logic so that if the Gemini API key is not yet set or model quota is exceeded, realistic intelligent template responses are generated for seamless development and live demos.
