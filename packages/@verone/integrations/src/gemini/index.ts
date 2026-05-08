// =====================================================================
// Gemini module — exports publics
// =====================================================================

export { GeminiClient, getGeminiClient } from './client';
export {
  GeminiError,
  isGeminiError,
  createGeminiErrorFromResponse,
} from './errors';
export type { GeminiErrorCode } from './errors';
export type {
  GeminiGenerateImageRequest,
  GeminiGenerateImageResponse,
  GeminiImageSource,
  GeminiGenerateImageInput,
  GeminiGenerateImageResult,
} from './types';
