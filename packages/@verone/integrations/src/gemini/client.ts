// =====================================================================
// Gemini API Client
// Date: 2026-05-08
// Description: Client HTTP pour l'API Google Gemini génération d'images
// =====================================================================

import { GeminiError, createGeminiErrorFromResponse } from './errors';
import { GeminiGenerateImageResponseSchema } from './types';
import type {
  GeminiGenerateImageInput,
  GeminiGenerateImageResult,
  GeminiImageSource,
} from './types';

// =====================================================================
// CONSTANTES
// =====================================================================

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_PRIMARY_MODEL = 'gemini-2.5-flash-preview-04-17';
const DEFAULT_FALLBACK_MODEL = 'gemini-2.0-flash-exp';
const TIMEOUT_MS = 60_000;

// =====================================================================
// CLIENT
// =====================================================================

export class GeminiClient {
  private readonly apiKey: string;
  private readonly primaryModel: string;
  private readonly fallbackModel: string;

  constructor(config?: {
    apiKey?: string;
    primaryModel?: string;
    fallbackModel?: string;
  }) {
    const apiKey = config?.apiKey ?? process.env['GOOGLE_GEMINI_API_KEY'];
    if (!apiKey) {
      throw new GeminiError(
        'GOOGLE_GEMINI_API_KEY is not set. Configure this environment variable to use Gemini image generation.',
        'AUTH_ERROR',
        0
      );
    }
    this.apiKey = apiKey;
    this.primaryModel =
      config?.primaryModel ??
      process.env['GOOGLE_GEMINI_IMAGE_MODEL'] ??
      DEFAULT_PRIMARY_MODEL;
    this.fallbackModel =
      config?.fallbackModel ??
      process.env['GOOGLE_GEMINI_FALLBACK_MODEL'] ??
      DEFAULT_FALLBACK_MODEL;
  }

  /**
   * Génère une image via Gemini à partir d'images sources + prompt.
   * Tente le primaryModel, retry 1 fois, puis fallback sur fallbackModel.
   */
  async generateImage(
    input: GeminiGenerateImageInput
  ): Promise<GeminiGenerateImageResult> {
    const modelToUse = input.model ?? this.primaryModel;

    // Tentative 1 : primary model
    try {
      const result = await this.callGemini(
        modelToUse,
        input.sourceImagesBase64,
        input.prompt
      );
      return { ...result, modelUsed: modelToUse };
    } catch (firstError) {
      const err1 = firstError instanceof GeminiError ? firstError : null;
      const shouldRetry = err1?.isRetryable ?? false;

      if (shouldRetry) {
        console.warn(
          '[GeminiClient] Primary model attempt 1 failed, retrying...',
          { code: err1?.code, model: modelToUse }
        );
        // Retry 1 fois sur primary model
        try {
          const result = await this.callGemini(
            modelToUse,
            input.sourceImagesBase64,
            input.prompt
          );
          return { ...result, modelUsed: modelToUse };
        } catch (retryError) {
          console.warn(
            '[GeminiClient] Primary model retry failed, switching to fallback model...',
            {
              code:
                retryError instanceof GeminiError ? retryError.code : 'UNKNOWN',
              fallbackModel: this.fallbackModel,
            }
          );
          // Fallback sur le second modèle
          const result = await this.callGemini(
            this.fallbackModel,
            input.sourceImagesBase64,
            input.prompt
          );
          return { ...result, modelUsed: this.fallbackModel };
        }
      }

      // Erreur non retryable (AUTH, SAFETY_BLOCK, VALIDATION_ERROR, etc.)
      throw firstError;
    }
  }

  // ===================================================================
  // PRIVÉ
  // ===================================================================

  private async callGemini(
    model: string,
    sourceImages: GeminiImageSource[],
    prompt: string
  ): Promise<{ imageBase64: string; mimeType: string }> {
    // API key passée via header x-goog-api-key (recommandation Google).
    // Évite la fuite de la clé dans les logs Sentry/Datadog qui peuvent
    // capturer l'URL en cas d'erreur réseau.
    const url = `${GEMINI_API_BASE}/${model}:generateContent`;

    // Construction du body : images sources en premier, puis le prompt texte
    const imageParts = sourceImages.map(img => ({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data,
      },
    }));

    const body = {
      contents: [
        {
          parts: [...imageParts, { text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['Image'],
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new GeminiError(
          `Gemini request timed out after ${TIMEOUT_MS / 1000}s`,
          'TIMEOUT',
          408
        );
      }

      throw new GeminiError(
        fetchError instanceof Error ? fetchError.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = (await response.json()) as Record<string, unknown>;
      } catch {
        // Réponse non-JSON, on garde errorData vide
      }
      throw createGeminiErrorFromResponse(response.status, errorData);
    }

    // Parse + validation Zod stricte
    let rawData: unknown;
    try {
      rawData = await response.json();
    } catch {
      throw new GeminiError(
        'Gemini returned non-JSON response',
        'SERVER_ERROR',
        200
      );
    }

    const parsed = GeminiGenerateImageResponseSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new GeminiError(
        `Gemini response schema validation failed: ${parsed.error.message}`,
        'SERVER_ERROR',
        200,
        { zodError: parsed.error.flatten() }
      );
    }

    const geminiResponse = parsed.data;

    // Vérifier si la réponse a été bloquée par le safety filter
    if (
      geminiResponse.promptFeedback?.blockReason ||
      !geminiResponse.candidates?.length
    ) {
      throw new GeminiError(
        'Gemini generation blocked by safety filters or returned empty candidates',
        'SAFETY_BLOCK',
        200,
        { promptFeedback: geminiResponse.promptFeedback }
      );
    }

    // Extraire la première image de la réponse
    const candidate = geminiResponse.candidates[0];
    if (!candidate?.content?.parts?.length) {
      throw new GeminiError(
        'Gemini response contains no parts in candidate',
        'SAFETY_BLOCK',
        200
      );
    }

    // Chercher la partie contenant une image
    for (const part of candidate.content.parts) {
      if ('inline_data' in part && part.inline_data) {
        const { mime_type, data } = part.inline_data;
        if (data) {
          return { imageBase64: data, mimeType: mime_type };
        }
      }
    }

    throw new GeminiError(
      'Gemini response did not contain an image part',
      'SAFETY_BLOCK',
      200,
      { parts: candidate.content.parts }
    );
  }
}

// =====================================================================
// SINGLETON FACTORY
// =====================================================================

let geminiClientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  geminiClientInstance ??= new GeminiClient();
  return geminiClientInstance;
}
