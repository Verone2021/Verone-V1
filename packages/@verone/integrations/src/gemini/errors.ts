// =====================================================================
// Gemini API Errors
// Date: 2026-05-08
// Description: Gestion erreurs typées pour intégration Google Gemini API
// =====================================================================

export type GeminiErrorCode =
  | 'AUTH_ERROR' // 401/403: Credentials invalides ou quota dépassé
  | 'VALIDATION_ERROR' // 400: Paramètres invalides
  | 'RATE_LIMIT' // 429: Quota API dépassé
  | 'SERVER_ERROR' // 500/502/503: Erreur serveur Gemini
  | 'TIMEOUT' // Timeout 60s dépassé
  | 'NETWORK_ERROR' // Erreur réseau
  | 'MODEL_UNAVAILABLE' // 404: Modèle introuvable ou non disponible
  | 'SAFETY_BLOCK' // Réponse bloquée par le filtre de sécurité
  | 'UNKNOWN_ERROR'; // Erreur inconnue

export class GeminiError extends Error {
  public readonly code: GeminiErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: GeminiErrorCode,
    statusCode: number = 0,
    details?: unknown
  ) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isRetryable = this.determineRetryability();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GeminiError);
    }
  }

  private determineRetryability(): boolean {
    const retryableCodes: GeminiErrorCode[] = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'RATE_LIMIT',
    ];
    return retryableCodes.includes(this.code);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      details: this.details,
      stack: this.stack,
    };
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return "Erreur d'authentification avec le service de génération d'images. Vérifiez la clé API.";
      case 'VALIDATION_ERROR':
        return 'Paramètres de génération invalides. Vérifiez vos images sources et votre prompt.';
      case 'RATE_LIMIT':
        return 'Limite de génération atteinte. Veuillez réessayer dans quelques instants.';
      case 'SERVER_ERROR':
        return 'Le service de génération est temporairement indisponible. Veuillez réessayer.';
      case 'TIMEOUT':
        return 'La génération a pris trop de temps. Veuillez réessayer (images sources plus légères recommandées).';
      case 'NETWORK_ERROR':
        return 'Erreur de connexion réseau. Vérifiez votre connexion et réessayez.';
      case 'MODEL_UNAVAILABLE':
        return 'Le modèle de génération est temporairement indisponible. Le modèle de secours sera utilisé.';
      case 'SAFETY_BLOCK':
        return 'La génération a été bloquée par les filtres de sécurité. Modifiez votre prompt ou vos images sources.';
      default:
        return 'Une erreur inattendue est survenue lors de la génération. Veuillez réessayer.';
    }
  }

  getRetryDelay(): number {
    switch (this.code) {
      case 'RATE_LIMIT':
        return 60000; // 1 minute
      case 'SERVER_ERROR':
        return 5000; // 5 secondes
      case 'TIMEOUT':
      case 'NETWORK_ERROR':
        return 2000; // 2 secondes
      default:
        return 0;
    }
  }
}

/**
 * Helper pour créer une GeminiError depuis une réponse HTTP
 */
export function createGeminiErrorFromResponse(
  status: number,
  data?: Record<string, unknown>
): GeminiError {
  const message = String(
    data?.message ??
      data?.error ??
      (data?.error as Record<string, unknown> | undefined)?.message ??
      `Gemini API error (${status})`
  );

  switch (status) {
    case 400:
      return new GeminiError(message, 'VALIDATION_ERROR', status, data);
    case 401:
    case 403:
      return new GeminiError(
        'Invalid or missing Gemini API key',
        'AUTH_ERROR',
        status,
        data
      );
    case 404:
      return new GeminiError(
        'Gemini model not found or unavailable',
        'MODEL_UNAVAILABLE',
        status,
        data
      );
    case 429:
      return new GeminiError(
        'Gemini rate limit exceeded',
        'RATE_LIMIT',
        status,
        data
      );
    case 500:
    case 502:
    case 503:
      return new GeminiError(
        'Gemini server error',
        'SERVER_ERROR',
        status,
        data
      );
    default:
      return new GeminiError(message, 'UNKNOWN_ERROR', status, data);
  }
}

/**
 * Type guard pour vérifier si une erreur est une GeminiError
 */
export function isGeminiError(error: unknown): error is GeminiError {
  return error instanceof GeminiError;
}
