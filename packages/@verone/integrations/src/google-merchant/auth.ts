/**
 * 🔐 Google Merchant Center Authentication
 *
 * Service Account authentication pour l'API Google Merchant Center
 * Basé sur les best practices officielles Google Cloud
 *
 * Last update: 2025-10-09 - Real credentials configured
 */

import type { JWT } from 'google-auth-library';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

import logger from '@verone/utils/logger';

import { GOOGLE_MERCHANT_CONFIG, validateGoogleMerchantEnv } from './config';

// Interface pour les credentials
interface ServiceAccountCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Crée les credentials Service Account depuis les variables d'environnement
 */
/**
 * 🔧 RUNTIME ENV LOADER - Bypass Next.js webpack compilation
 *
 * Next.js compile process.env.X values au build time via webpack.
 * Cette fonction lit directement .env.local au runtime pour bypass webpack.
 *
 * Root cause: Webpack DefinePlugin remplace process.env.X par literal strings
 * Solution: Lecture directe filesystem au runtime
 */
function loadRuntimeEnvVariable(key: string): string | undefined {
  // Server-side only (filesystem access)
  if (typeof window !== 'undefined') {
    throw new Error('Runtime env loading is server-side only');
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  try {
    const envPath: string = path.join(process.cwd(), '.env.local');
    const envContent: string = fs.readFileSync(envPath, 'utf-8');

    // Parse .env.local line by line
    const lines: string[] = envContent.split('\n');
    for (const line of lines) {
      // Match: KEY="value" or KEY=value
      const match: RegExpMatchArray | null = line.match(
        /^([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?$/
      );
      if (match?.[1] === key) {
        let value: string = match[2];

        // Handle quoted values
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        return value;
      }
    }
  } catch (_error) {
    // Fallback to process.env if file read fails
    console.warn(
      `[Runtime Env] Failed to read .env.local for ${key}, using process.env fallback`
    );
  }

  return process.env[key];
}

function createServiceAccountCredentials(): ServiceAccountCredentials {
  validateGoogleMerchantEnv();

  // 🔥 RUNTIME LOADING: Bypass webpack compilation cache
  const clientEmail = loadRuntimeEnvVariable(
    'GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL'
  );
  const privateKeyId = loadRuntimeEnvVariable('GOOGLE_MERCHANT_PRIVATE_KEY_ID');
  const clientId = loadRuntimeEnvVariable('GOOGLE_MERCHANT_CLIENT_ID');
  const projectId = loadRuntimeEnvVariable('GOOGLE_CLOUD_PROJECT_ID');
  let privateKey = loadRuntimeEnvVariable('GOOGLE_MERCHANT_PRIVATE_KEY');

  if (!privateKey || !clientEmail) {
    throw new Error(
      'GOOGLE_MERCHANT credentials manquantes (privateKey ou clientEmail)'
    );
  }

  // 🔧 FIX: Support multiple formats (senior dev best practice)
  // Format 1: Base64 encoded (recommended for deployment)
  // Format 2: PEM with literal \n (standard .env format)
  // Format 3: PEM with real newlines (current .env.local format)

  try {
    // Check if Base64 encoded (recommended by Stack Overflow/GitHub)
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      // Decode Base64 format
      privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    }
  } catch (_error) {
    // Not Base64, continue with other formats
  }

  // 🔍 DIAGNOSTIC: Log key format before processing
  console.warn('[DEBUG] Private key length:', privateKey.length);
  console.warn('[DEBUG] Has \\n literal?', privateKey.includes('\\n'));
  console.warn('[DEBUG] Has real newline?', privateKey.includes('\n'));
  console.warn('[DEBUG] First 100 chars:', privateKey.substring(0, 100));

  // Handle literal \n characters (convert to real newlines)
  // Note: In .env files, \n can be stored in multiple formats
  // Format 1: Literal \\n (double backslash) from some env loaders
  // Format 2: Literal \n (escaped in string) - most common
  if (privateKey.includes('\\n')) {
    console.warn('[DEBUG] Converting \\n to real newlines...');
    privateKey = privateKey.replace(/\\n/g, '\n');
    console.warn(
      '[DEBUG] After conversion - has newlines?',
      privateKey.includes('\n')
    );
  }

  // Validate PEM format
  if (
    !privateKey.includes('BEGIN PRIVATE KEY') ||
    !privateKey.includes('END PRIVATE KEY')
  ) {
    throw new Error(
      'GOOGLE_MERCHANT_PRIVATE_KEY format invalide (PEM attendu)'
    );
  }

  console.warn('[DEBUG] PEM validation passed - key ready for JWT');

  return {
    type: 'service_account',
    project_id: projectId ?? 'verone-merchant-center',
    private_key_id: privateKeyId ?? '',
    private_key: privateKey,
    client_email: clientEmail,
    client_id: clientId ?? '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  };
}

/**
 * Classe principale pour l'authentification Google Merchant
 */
export class GoogleMerchantAuth {
  private auth: GoogleAuth;
  private jwtClient: JWT | null = null;

  constructor() {
    try {
      const credentials = createServiceAccountCredentials();

      this.auth = new GoogleAuth({
        credentials,
        scopes: GOOGLE_MERCHANT_CONFIG.scopes as string[],
      });

      // Log de configuration (sans les clés sensibles)
      logger.info('[Google Merchant Auth] Configuration initialisée', {
        operation: 'google_merchant_init',
        accountId: GOOGLE_MERCHANT_CONFIG.accountId,
        dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
        clientEmail: credentials.client_email,
        scopesCount: GOOGLE_MERCHANT_CONFIG.scopes.length,
      });
    } catch (error) {
      logger.error(
        '[Google Merchant Auth] Erreur configuration',
        error as Error,
        {
          operation: 'google_merchant_init_failed',
        }
      );
      throw error;
    }
  }

  /**
   * Obtient un client JWT authentifié
   */
  async getJWTClient(): Promise<JWT> {
    if (!this.jwtClient) {
      try {
        this.jwtClient = (await this.auth.getClient()) as JWT;
        logger.info('[Google Merchant Auth] Client JWT créé avec succès', {
          operation: 'jwt_client_creation',
        });
      } catch (error) {
        logger.error(
          '[Google Merchant Auth] Erreur création JWT',
          error as Error,
          {
            operation: 'jwt_client_creation_failed',
          }
        );
        throw new Error(`Erreur authentification Google: ${error}`);
      }
    }
    return this.jwtClient;
  }

  /**
   * Obtient un token d'accès valide
   */
  async getAccessToken(): Promise<string> {
    try {
      const client = await this.getJWTClient();

      console.warn('[DEBUG] Calling getAccessToken()...');
      console.warn('[DEBUG] Client email:', client.email);
      console.warn('[DEBUG] Scopes:', client.scopes);

      const tokenResponse = await client.getAccessToken();

      console.warn('[DEBUG] Token response received:', {
        hasToken: !!tokenResponse.token,
        tokenLength: tokenResponse.token?.length,
      });

      if (!tokenResponse.token) {
        throw new Error("Token d'accès non obtenu");
      }

      console.warn('[DEBUG] Access token obtained successfully');
      return tokenResponse.token;
    } catch (error) {
      // 🔍 ENHANCED ERROR DIAGNOSTIC
      console.error('[DEBUG] getAccessToken() failed with error:', {
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorKeys: error ? Object.keys(error) : [],
        errorJSON: error
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : null,
      });

      // ⚠️ CRITIQUE: Ne JAMAIS logger le token OAuth en clair
      logger.error(
        '[Google Merchant Auth] Erreur obtention token',
        error as Error,
        {
          operation: 'access_token_failed',
          errorType: (error as Error).name,
          errorMessage: (error as Error).message,
        }
      );
      throw error;
    }
  }

  /**
   * Crée les headers d'authentification pour les requêtes API
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Goog-User-Project':
        process.env.GOOGLE_CLOUD_PROJECT_ID ?? 'verone-merchant-center',
    };
  }

  /**
   * Teste la validité de l'authentification
   */
  async testAuthentication(): Promise<boolean> {
    try {
      await this.getAccessToken();
      logger.info('[Google Merchant Auth] Test authentification: ✅ Succès', {
        operation: 'auth_test',
        status: 'success',
      });
      return true;
    } catch (error) {
      logger.error(
        '[Google Merchant Auth] Test authentification: ❌ Échec',
        error as Error,
        {
          operation: 'auth_test',
          status: 'failed',
        }
      );
      return false;
    }
  }

  /**
   * Crée une instance configurée de googleapis.auth
   */
  async getGoogleApisAuth() {
    const client = await this.getJWTClient();
    return google.auth.fromJSON(
      (client.credentials ?? {}) as Parameters<typeof google.auth.fromJSON>[0]
    );
  }
}

// Instance singleton
let authInstance: GoogleMerchantAuth | null = null;

/**
 * Obtient l'instance singleton d'authentification
 */
export function getGoogleMerchantAuth(): GoogleMerchantAuth {
  authInstance ??= new GoogleMerchantAuth();
  return authInstance;
}

/**
 * Helper pour tester rapidement l'authentification
 */
export async function testGoogleMerchantAuth(): Promise<boolean> {
  try {
    const auth = getGoogleMerchantAuth();
    return await auth.testAuthentication();
  } catch (error) {
    console.error('[Google Merchant Auth] Test failed:', error);
    return false;
  }
}
