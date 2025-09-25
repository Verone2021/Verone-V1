/**
 * 🔐 Google Merchant Center Authentication
 *
 * Service Account authentication pour l'API Google Merchant Center
 * Basé sur les best practices officielles Google Cloud
 */

import { google } from 'googleapis'
import { GoogleAuth, JWT } from 'google-auth-library'
import { GOOGLE_MERCHANT_CONFIG, validateGoogleMerchantEnv } from './config'

// Interface pour les credentials
interface ServiceAccountCredentials {
  type: 'service_account'
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

/**
 * Crée les credentials Service Account depuis les variables d'environnement
 */
function createServiceAccountCredentials(): ServiceAccountCredentials {
  validateGoogleMerchantEnv()

  const privateKey = process.env.GOOGLE_MERCHANT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!privateKey) {
    throw new Error('GOOGLE_MERCHANT_PRIVATE_KEY manquante ou invalide')
  }

  return {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || 'verone-merchant-center',
    private_key_id: process.env.GOOGLE_MERCHANT_PRIVATE_KEY_ID || '',
    private_key: privateKey,
    client_email: process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL!,
    client_id: process.env.GOOGLE_MERCHANT_CLIENT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL!)}`
  }
}

/**
 * Classe principale pour l'authentification Google Merchant
 */
export class GoogleMerchantAuth {
  private auth: GoogleAuth
  private jwtClient: JWT | null = null

  constructor() {
    try {
      const credentials = createServiceAccountCredentials()

      this.auth = new GoogleAuth({
        credentials,
        scopes: GOOGLE_MERCHANT_CONFIG.scopes
      })

      // Log de configuration (sans les clés sensibles)
      console.log('[Google Merchant Auth] Configuration:', {
        accountId: GOOGLE_MERCHANT_CONFIG.accountId,
        dataSourceId: GOOGLE_MERCHANT_CONFIG.dataSourceId,
        clientEmail: credentials.client_email,
        scopes: GOOGLE_MERCHANT_CONFIG.scopes
      })
    } catch (error) {
      console.error('[Google Merchant Auth] Erreur configuration:', error)
      throw error
    }
  }

  /**
   * Obtient un client JWT authentifié
   */
  async getJWTClient(): Promise<JWT> {
    if (!this.jwtClient) {
      try {
        this.jwtClient = await this.auth.getClient() as JWT
        console.log('[Google Merchant Auth] Client JWT créé avec succès')
      } catch (error) {
        console.error('[Google Merchant Auth] Erreur création JWT:', error)
        throw new Error(`Erreur authentification Google: ${error}`)
      }
    }
    return this.jwtClient
  }

  /**
   * Obtient un token d'accès valide
   */
  async getAccessToken(): Promise<string> {
    try {
      const client = await this.getJWTClient()
      const tokenResponse = await client.getAccessToken()

      if (!tokenResponse.token) {
        throw new Error('Token d\'accès non obtenu')
      }

      return tokenResponse.token
    } catch (error) {
      console.error('[Google Merchant Auth] Erreur obtention token:', error)
      throw error
    }
  }

  /**
   * Crée les headers d'authentification pour les requêtes API
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Goog-User-Project': process.env.GOOGLE_CLOUD_PROJECT_ID || 'verone-merchant-center'
    }
  }

  /**
   * Teste la validité de l'authentification
   */
  async testAuthentication(): Promise<boolean> {
    try {
      await this.getAccessToken()
      console.log('[Google Merchant Auth] Test authentification: ✅ Succès')
      return true
    } catch (error) {
      console.error('[Google Merchant Auth] Test authentification: ❌ Échec', error)
      return false
    }
  }

  /**
   * Crée une instance configurée de googleapis.auth
   */
  async getGoogleApisAuth() {
    const client = await this.getJWTClient()
    return google.auth.fromJSON(client.credentials || {})
  }
}

// Instance singleton
let authInstance: GoogleMerchantAuth | null = null

/**
 * Obtient l'instance singleton d'authentification
 */
export function getGoogleMerchantAuth(): GoogleMerchantAuth {
  if (!authInstance) {
    authInstance = new GoogleMerchantAuth()
  }
  return authInstance
}

/**
 * Helper pour tester rapidement l'authentification
 */
export async function testGoogleMerchantAuth(): Promise<boolean> {
  try {
    const auth = getGoogleMerchantAuth()
    return await auth.testAuthentication()
  } catch (error) {
    console.error('[Google Merchant Auth] Test failed:', error)
    return false
  }
}