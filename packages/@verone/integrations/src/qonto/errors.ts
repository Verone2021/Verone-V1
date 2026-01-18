// =====================================================================
// Qonto API Errors
// Date: 2025-10-11
// Description: Gestion erreurs pour intégration Qonto Banking API
// =====================================================================

export type QontoErrorCode =
  | 'AUTH_ERROR' // 401: Credentials invalides
  | 'AUTH_CONFIG_ERROR' // 0: Configuration auth manquante/invalide
  | 'AUTH_CONFIG_MISSING' // 0: Aucune variable env Qonto configurée
  | 'AUTH_CONFIG_CONFLICT' // 0: Conflit OAuth + API Key simultanes
  | 'PERMISSION_ERROR' // 403: Permissions insuffisantes
  | 'NOT_FOUND' // 404: Ressource introuvable
  | 'VALIDATION_ERROR' // 400: Paramètres invalides
  | 'RATE_LIMIT' // 429: Quota API dépassé
  | 'SERVER_ERROR' // 500/502/503: Erreur serveur Qonto
  | 'TIMEOUT' // 408: Request timeout
  | 'NETWORK_ERROR' // 0: Erreur réseau
  | 'UNKNOWN_ERROR'; // Erreur inconnue

export class QontoError extends Error {
  public readonly code: QontoErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: QontoErrorCode,
    statusCode: number = 0,
    details?: any
  ) {
    super(message);
    this.name = 'QontoError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isRetryable = this.determineRetryability();

    // Maintain proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QontoError);
    }
  }

  /**
   * Détermine si l'erreur justifie un retry automatique
   */
  private determineRetryability(): boolean {
    const retryableCodes: QontoErrorCode[] = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'RATE_LIMIT',
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Conversion en objet JSON pour logging/monitoring
   */
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

  /**
   * Message utilisateur friendly (sans détails techniques)
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return "Erreur d'authentification Qonto. Vérifiez vos identifiants.";
      case 'AUTH_CONFIG_ERROR':
        return "Configuration Qonto manquante. Vérifiez vos variables d'environnement.";
      case 'AUTH_CONFIG_MISSING':
        return "Configuration Qonto non trouvée. Consultez la documentation (docs/integrations/vercel-env-qonto-setup.md).";
      case 'AUTH_CONFIG_CONFLICT':
        return "Conflit de configuration Qonto. Définissez QONTO_AUTH_MODE explicitement.";
      case 'PERMISSION_ERROR':
        return 'Permissions insuffisantes pour accéder à cette ressource Qonto.';
      case 'NOT_FOUND':
        return 'Ressource Qonto introuvable.';
      case 'VALIDATION_ERROR':
        return 'Paramètres de requête invalides.';
      case 'RATE_LIMIT':
        return 'Limite de taux API Qonto dépassée. Veuillez réessayer dans quelques instants.';
      case 'SERVER_ERROR':
        return 'Erreur serveur Qonto. Veuillez réessayer.';
      case 'TIMEOUT':
        return 'La requête a expiré. Veuillez réessayer.';
      case 'NETWORK_ERROR':
        return 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
      default:
        return "Une erreur inattendue s'est produite.";
    }
  }

  /**
   * Durée de retry suggérée (en ms)
   */
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
        return 0; // Pas de retry suggéré
    }
  }
}

/**
 * Helper pour créer une QontoError depuis une réponse HTTP
 */
export function createQontoErrorFromResponse(
  status: number,
  responseData?: any
): QontoError {
  const message =
    responseData?.message ||
    responseData?.error ||
    `Qonto API error (${status})`;

  switch (status) {
    case 400:
      return new QontoError(message, 'VALIDATION_ERROR', status, responseData);
    case 401:
      return new QontoError(
        'Invalid Qonto credentials',
        'AUTH_ERROR',
        status,
        responseData
      );
    case 403:
      return new QontoError(
        'Insufficient Qonto permissions',
        'PERMISSION_ERROR',
        status,
        responseData
      );
    case 404:
      return new QontoError(
        'Resource not found',
        'NOT_FOUND',
        status,
        responseData
      );
    case 429:
      return new QontoError(
        'Qonto rate limit exceeded',
        'RATE_LIMIT',
        status,
        responseData
      );
    case 500:
    case 502:
    case 503:
      return new QontoError(
        'Qonto server error',
        'SERVER_ERROR',
        status,
        responseData
      );
    default:
      return new QontoError(message, 'UNKNOWN_ERROR', status, responseData);
  }
}

/**
 * Type guard pour vérifier si une erreur est une QontoError
 */
export function isQontoError(error: unknown): error is QontoError {
  return error instanceof QontoError;
}
