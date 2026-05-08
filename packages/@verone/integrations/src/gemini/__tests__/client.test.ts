// =====================================================================
// Tests GeminiClient
// =====================================================================

import { GeminiClient } from '../client';
import { GeminiError, isGeminiError } from '../errors';

// =====================================================================
// HELPERS
// =====================================================================

const MOCK_API_KEY = 'test-api-key-123';

const MOCK_SUCCESS_RESPONSE = {
  candidates: [
    {
      content: {
        parts: [
          {
            inline_data: {
              mime_type: 'image/png',
              data: 'base64encodedimagedata',
            },
          },
        ],
      },
      finishReason: 'STOP',
    },
  ],
};

const MOCK_SOURCE_IMAGE = {
  mimeType: 'image/jpeg',
  data: 'basesimagejpegdata',
};

function makeFetch(
  status: number,
  body: unknown,
  options?: { reject?: boolean }
): jest.Mock {
  const mockFetch = jest.fn();
  if (options?.reject) {
    mockFetch.mockRejectedValue(new Error('Network error'));
  } else {
    mockFetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  }
  return mockFetch;
}

// =====================================================================
// TESTS
// =====================================================================

describe('GeminiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Nettoyer le singleton
    // On recrée une instance fraîche dans chaque test
  });

  describe('constructor', () => {
    it('throws GeminiError if no API key', () => {
      expect(() => {
        new GeminiClient({ apiKey: undefined });
      }).toThrow(GeminiError);
    });

    it('creates client with provided API key', () => {
      expect(() => {
        new GeminiClient({ apiKey: MOCK_API_KEY });
      }).not.toThrow();
    });
  });

  describe('generateImage — success on primary model', () => {
    it('returns imageBase64 and modelUsed on success', async () => {
      global.fetch = makeFetch(200, MOCK_SUCCESS_RESPONSE);

      const client = new GeminiClient({
        apiKey: MOCK_API_KEY,
        primaryModel: 'gemini-2.5-flash-preview-04-17',
        fallbackModel: 'gemini-2.0-flash-exp',
      });

      const result = await client.generateImage({
        sourceImagesBase64: [MOCK_SOURCE_IMAGE],
        prompt: 'A beautiful interior photo',
      });

      expect(result.imageBase64).toBe('base64encodedimagedata');
      expect(result.mimeType).toBe('image/png');
      expect(result.modelUsed).toBe('gemini-2.5-flash-preview-04-17');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateImage — retry on 503, then success', () => {
    it('retries once on SERVER_ERROR and succeeds on retry', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_SUCCESS_RESPONSE),
        });

      global.fetch = mockFetch;

      const client = new GeminiClient({
        apiKey: MOCK_API_KEY,
        primaryModel: 'gemini-2.5-flash-preview-04-17',
        fallbackModel: 'gemini-2.0-flash-exp',
      });

      const result = await client.generateImage({
        sourceImagesBase64: [MOCK_SOURCE_IMAGE],
        prompt: 'A product shot',
      });

      expect(result.imageBase64).toBe('base64encodedimagedata');
      expect(result.modelUsed).toBe('gemini-2.5-flash-preview-04-17');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateImage — fallback after 2 primary failures', () => {
    it('falls back to fallback model after 2 primary failures', async () => {
      const fallbackResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: 'fallback-image-data',
                  },
                },
              ],
            },
          },
        ],
      };

      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Service unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(fallbackResponse),
        });

      global.fetch = mockFetch;

      const client = new GeminiClient({
        apiKey: MOCK_API_KEY,
        primaryModel: 'gemini-2.5-flash-preview-04-17',
        fallbackModel: 'gemini-2.0-flash-exp',
      });

      const result = await client.generateImage({
        sourceImagesBase64: [MOCK_SOURCE_IMAGE],
        prompt: 'A product shot',
      });

      expect(result.imageBase64).toBe('fallback-image-data');
      expect(result.modelUsed).toBe('gemini-2.0-flash-exp');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateImage — AUTH_ERROR (401)', () => {
    it('throws GeminiError with AUTH_ERROR code on 401', async () => {
      global.fetch = makeFetch(401, {
        error: { message: 'API key not valid' },
      });

      const client = new GeminiClient({
        apiKey: MOCK_API_KEY,
        primaryModel: 'gemini-2.5-flash-preview-04-17',
        fallbackModel: 'gemini-2.0-flash-exp',
      });

      await expect(
        client.generateImage({
          sourceImagesBase64: [MOCK_SOURCE_IMAGE],
          prompt: 'A product shot',
        })
      ).rejects.toSatisfy((err: unknown) => {
        expect(isGeminiError(err)).toBe(true);
        if (isGeminiError(err)) {
          expect(err.code).toBe('AUTH_ERROR');
          expect(err.isRetryable).toBe(false);
        }
        return true;
      });

      // AUTH_ERROR n'est pas retryable — 1 seul appel
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateImage — RATE_LIMIT (429)', () => {
    it('throws GeminiError with RATE_LIMIT code after retry and fallback on 429', async () => {
      global.fetch = makeFetch(429, { error: 'RESOURCE_EXHAUSTED' });

      const client = new GeminiClient({
        apiKey: MOCK_API_KEY,
        primaryModel: 'gemini-2.5-flash-preview-04-17',
        fallbackModel: 'gemini-2.0-flash-exp',
      });

      await expect(
        client.generateImage({
          sourceImagesBase64: [MOCK_SOURCE_IMAGE],
          prompt: 'A product shot',
        })
      ).rejects.toSatisfy((err: unknown) => {
        expect(isGeminiError(err)).toBe(true);
        if (isGeminiError(err)) {
          expect(err.code).toBe('RATE_LIMIT');
        }
        return true;
      });
    });
  });
});
