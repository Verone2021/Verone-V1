/**
 * Pinterest API client (squelette).
 *
 * Doc officielle : https://developers.pinterest.com/docs/api/v5/
 *
 * Endpoints utilises :
 *   - GET /v5/pins/{pin_id}/analytics : Pin Analytics
 *   - GET /v5/user_account/analytics : Account Analytics
 *   - POST /v5/pins : creer une epingle
 *   - POST /v5/ad_accounts/{ad_account_id}/events : Conversions API
 *
 * Auth : OAuth 2.0 avec refresh token long-lived.
 *   - PINTEREST_ACCESS_TOKEN
 *   - PINTEREST_AD_ACCOUNT_ID (pour CAPI)
 *
 * Garde-fous :
 *   - Pinterest API ToS interdit le stockage analytics > 90 jours
 *   - Rate limit : 1000 calls/heure par token
 *
 * STATUT : SQUELETTE — implementation finale apres reception
 * credentials Pinterest Business Account.
 */

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

export interface PinAnalyticsResult {
  pin_id: string;
  metrics: {
    impressions: number;
    saves: number;
    pin_clicks: number;
    outbound_clicks: number;
  };
}

export interface PinterestClientConfig {
  accessToken?: string;
}

export class PinterestClient {
  private readonly accessToken: string;

  constructor(config?: PinterestClientConfig) {
    const token =
      config?.accessToken ?? process.env['PINTEREST_ACCESS_TOKEN'] ?? '';
    if (!token) {
      throw new Error('PINTEREST_ACCESS_TOKEN is not set.');
    }
    this.accessToken = token;
  }

  /**
   * Recupere les analytics d une epingle.
   * TODO : implementer le pull complet avec gestion des metriques
   * granulaires (par jour, par device, par age, etc.).
   */
  async getPinAnalytics(pinId: string): Promise<PinAnalyticsResult> {
    const url = `${PINTEREST_API_BASE}/pins/${pinId}/analytics?metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Pinterest API error: ${res.status}`);
    }

    // Parse simplifie pour le squelette ; le vrai pipeline doit gerer
    // la structure complete de la reponse Pinterest.
    // TODO: parser raw.summary_metrics.IMPRESSION etc. quand credentials
    // disponibles pour valider le format de reponse exact.
    void res.json();
    return {
      pin_id: pinId,
      metrics: {
        impressions: 0,
        saves: 0,
        pin_clicks: 0,
        outbound_clicks: 0,
      },
    };
  }
}
