// =====================================================================
// Gemini API Types
// Date: 2026-05-08
// Description: Zod schemas et types TS pour l'API Google Gemini Images
// =====================================================================

import { z } from 'zod';

// =====================================================================
// REQUEST SCHEMAS
// =====================================================================

export const GeminiInlineDataSchema = z.object({
  mime_type: z.string(),
  data: z.string(), // base64
});

export const GeminiTextPartSchema = z.object({
  text: z.string(),
});

export const GeminiInlineDataPartSchema = z.object({
  inline_data: GeminiInlineDataSchema,
});

export const GeminiPartSchema = z.union([
  GeminiTextPartSchema,
  GeminiInlineDataPartSchema,
]);

export const GeminiContentSchema = z.object({
  parts: z.array(GeminiPartSchema),
});

export const GeminiGenerationConfigSchema = z.object({
  responseModalities: z.array(z.string()),
});

export const GeminiGenerateImageRequestSchema = z.object({
  contents: z.array(GeminiContentSchema),
  generationConfig: GeminiGenerationConfigSchema,
});

// =====================================================================
// RESPONSE SCHEMAS
// =====================================================================

export const GeminiResponseInlineDataSchema = z.object({
  mime_type: z.string(),
  data: z.string(), // base64
});

export const GeminiResponseImagePartSchema = z.object({
  inline_data: GeminiResponseInlineDataSchema,
});

export const GeminiResponseTextPartSchema = z.object({
  text: z.string(),
});

export const GeminiResponsePartSchema = z.union([
  GeminiResponseImagePartSchema,
  GeminiResponseTextPartSchema,
]);

export const GeminiResponseContentSchema = z.object({
  parts: z.array(GeminiResponsePartSchema),
});

export const GeminiCandidateSchema = z.object({
  content: GeminiResponseContentSchema,
  finishReason: z.string().optional(),
  safetyRatings: z
    .array(
      z.object({
        category: z.string(),
        probability: z.string(),
      })
    )
    .optional(),
});

export const GeminiGenerateImageResponseSchema = z.object({
  candidates: z.array(GeminiCandidateSchema).optional(),
  promptFeedback: z
    .object({
      blockReason: z.string().optional(),
      safetyRatings: z
        .array(
          z.object({
            category: z.string(),
            probability: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

// =====================================================================
// INFERRED TYPES
// =====================================================================

export type GeminiGenerateImageRequest = z.infer<
  typeof GeminiGenerateImageRequestSchema
>;
export type GeminiGenerateImageResponse = z.infer<
  typeof GeminiGenerateImageResponseSchema
>;
export type GeminiInlineData = z.infer<typeof GeminiInlineDataSchema>;
export type GeminiPart = z.infer<typeof GeminiPartSchema>;
export type GeminiContent = z.infer<typeof GeminiContentSchema>;

// =====================================================================
// HELPER TYPES (entrées du client)
// =====================================================================

export interface GeminiImageSource {
  mimeType: string;
  data: string; // base64
}

export interface GeminiGenerateImageInput {
  sourceImagesBase64: GeminiImageSource[];
  prompt: string;
  model?: string;
}

export interface GeminiGenerateImageResult {
  imageBase64: string;
  mimeType: string;
  modelUsed: string;
}
