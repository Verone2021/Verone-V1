/**
 * GDPR Consent Manager - Vérone 2025
 * Gestion conforme du consentement utilisateur (RGPD français)
 */

// Use Web Crypto API for edge runtime compatibility
function createHash(_algorithm: string): {
  update: (data: string) => { digest: (_encoding: string) => string };
} {
  return {
    update: (data: string) => ({
      digest: (_encoding: string) => {
        // Simple hash for anonymization (not cryptographic)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      },
    }),
  };
}

export interface AnalyticsEvent {
  event_type:
    | 'page_view'
    | 'user_action'
    | 'business_metric'
    | 'performance_metric';
  event_name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  session_id: string;
  user_consent: ConsentLevel;
  anonymized: boolean;
}

export interface ConsentLevel {
  necessary: boolean; // Always true - required for functionality
  analytics: boolean; // User choice - anonymous usage analytics
  marketing: boolean; // User choice - personalization and CRM
  preferences: boolean; // User choice - UI/UX customization
}

export interface UserSession {
  session_id: string;
  created_at: Date;
  consent_given: ConsentLevel;
  consent_timestamp: Date;
  last_activity: Date;
  page_views: number;
  events_count: number;
  is_anonymous: boolean;
}

export interface BusinessMetrics {
  catalogue_usage: {
    products_viewed: number;
    collections_created: number;
    pdfs_generated: number;
    shares_completed: number;
  };
  performance_metrics: {
    avg_load_time: number;
    core_web_vitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  user_journey: {
    entry_page: string;
    exit_page: string;
    session_duration: number;
    pages_visited: number;
  };
}

/**
 * GDPR Consent Manager
 * Gestion conforme du consentement utilisateur
 */
export class GDPRConsentManager {
  private consent: ConsentLevel | null = null;
  private session_id: string;
  private storage_key = 'verone_consent_v2';

  constructor() {
    this.session_id = this.generateSessionId();
    this.loadStoredConsent();
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 16);
  }

  private loadStoredConsent(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storage_key);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        const parsedObj = parsed as {
          timestamp?: unknown;
          consent?: ConsentLevel;
        };

        const consentDate = new Date(
          parsedObj.timestamp as string | number | Date
        );
        const thirteenMonthsAgo = new Date();
        thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

        if (consentDate > thirteenMonthsAgo) {
          this.consent = parsedObj.consent ?? null;
        } else {
          this.clearConsent();
        }
      }
    } catch (error) {
      console.warn('[GDPR] Error loading consent:', error);
      this.clearConsent();
    }
  }

  setConsent(consent: ConsentLevel): void {
    this.consent = {
      necessary: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences,
    };

    const consentData = {
      consent: this.consent,
      timestamp: new Date().toISOString(),
      session_id: this.session_id,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storage_key, JSON.stringify(consentData));
      } catch (error) {
        console.warn('[GDPR] Error storing consent:', error);
      }
    }

    this.emitConsentEvent();
  }

  getConsent(): ConsentLevel | null {
    return this.consent;
  }

  canTrack(type: 'analytics' | 'marketing' | 'preferences'): boolean {
    if (!this.consent) return false;
    return this.consent[type] === true;
  }

  clearConsent(): void {
    this.consent = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storage_key);
      } catch (error) {
        console.warn('[GDPR] Error clearing consent:', error);
      }
    }
  }

  private emitConsentEvent(): void {
    if (typeof window !== 'undefined' && this.consent) {
      window.dispatchEvent(
        new CustomEvent('gdpr_consent_updated', {
          detail: { consent: this.consent, session_id: this.session_id },
        })
      );
    }
  }

  getSessionId(): string {
    return this.session_id;
  }
}
