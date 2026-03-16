/**
 * 📊 GDPR-Compliant Analytics System - Vérone 2025
 * Système analytics respectueux vie privée avec consent management
 * Conforme RGPD français + business intelligence sans compromis
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
 * 🍪 GDPR Consent Manager
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

  /**
   * 🔐 Génération session ID anonyme
   */
  private generateSessionId(): string {
    // Générer ID session sans données personnelles
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 💾 Chargement consent stocké
   */
  private loadStoredConsent(): void {
    if (typeof window === 'undefined') return; // SSR guard

    try {
      const stored = localStorage.getItem(this.storage_key);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        const parsedObj = parsed as {
          timestamp?: unknown;
          consent?: ConsentLevel;
        };

        // Vérifier validité (consent expire après 13 mois selon RGPD)
        const consentDate = new Date(
          parsedObj.timestamp as string | number | Date
        );
        const thirteenMonthsAgo = new Date();
        thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

        if (consentDate > thirteenMonthsAgo) {
          this.consent = parsedObj.consent ?? null;
        } else {
          // Consent expiré, supprimer
          this.clearConsent();
        }
      }
    } catch (error) {
      console.warn('[GDPR] Error loading consent:', error);
      this.clearConsent();
    }
  }

  /**
   * ✅ Définir consent utilisateur
   */
  setConsent(consent: ConsentLevel): void {
    this.consent = {
      necessary: true, // Toujours requis
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences,
    };

    // Stockage avec timestamp
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

    // Émettre événement consent pour analytics
    this.emitConsentEvent();
  }

  /**
   * 📋 Obtenir consent actuel
   */
  getConsent(): ConsentLevel | null {
    return this.consent;
  }

  /**
   * 🔍 Vérifier si tracking autorisé
   */
  canTrack(type: 'analytics' | 'marketing' | 'preferences'): boolean {
    if (!this.consent) return false;
    return this.consent[type] === true;
  }

  /**
   * 🗑️ Supprimer consent
   */
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

  /**
   * 📤 Émettre événement consent
   */
  private emitConsentEvent(): void {
    if (typeof window !== 'undefined' && this.consent) {
      window.dispatchEvent(
        new CustomEvent('gdpr_consent_updated', {
          detail: { consent: this.consent, session_id: this.session_id },
        })
      );
    }
  }

  /**
   * 📊 Obtenir session ID
   */
  getSessionId(): string {
    return this.session_id;
  }
}

/**
 * 📈 Analytics Engine GDPR-Compliant
 * Collecte analytics respectueuse avec anonymisation
 */
export class GDPRAnalytics {
  private consentManager: GDPRConsentManager;
  private events: AnalyticsEvent[] = [];
  private metrics: BusinessMetrics;
  private isInitialized = false;

  constructor() {
    this.consentManager = new GDPRConsentManager();
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
  }

  /**
   * 🚀 Initialisation analytics
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Vérifier consent avant initialisation
    const consent = this.consentManager.getConsent();
    if (!consent) {
      console.warn('[Analytics] Waiting for user consent...');
      return;
    }

    this.isInitialized = true;
    console.warn('[Analytics] Initialized with GDPR compliance');

    // Tracking initial si autorisé
    if (this.consentManager.canTrack('analytics')) {
      this.trackPageView(window.location.pathname);
    }
  }

  /**
   * 🎯 Tracking événement
   */
  track(event_name: string, properties: Record<string, unknown> = {}): void {
    const consent = this.consentManager.getConsent();
    if (!consent) return;

    // Filtrer propriétés selon consent
    const filteredProperties = this.filterPropertiesByConsent(
      properties,
      consent
    );

    const event: AnalyticsEvent = {
      event_type: 'user_action',
      event_name,
      properties: filteredProperties,
      timestamp: new Date(),
      session_id: this.consentManager.getSessionId(),
      user_consent: consent,
      anonymized: !consent.marketing,
    };

    this.addEvent(event);

    // Envoi différé si analytics autorisé
    if (consent.analytics) {
      void this.sendEventToEndpoint(event);
    }
  }

  /**
   * 📄 Tracking page view
   */
  trackPageView(path: string): void {
    const consent = this.consentManager.getConsent();
    if (!consent?.analytics) return;

    const event: AnalyticsEvent = {
      event_type: 'page_view',
      event_name: 'page_viewed',
      properties: {
        path: this.anonymizePath(path),
        referrer: this.anonymizeReferrer(document.referrer),
        user_agent: this.anonymizeUserAgent(navigator.userAgent),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
      },
      timestamp: new Date(),
      session_id: this.consentManager.getSessionId(),
      user_consent: consent,
      anonymized: true,
    };

    this.addEvent(event);
    this.updateMetrics('page_view', event.properties);
    void this.sendEventToEndpoint(event);
  }

  /**
   * 📊 Tracking métriques business
   */
  trackBusinessMetric(
    metric_name: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    const consent = this.consentManager.getConsent();
    if (!consent?.analytics) return;

    const event: AnalyticsEvent = {
      event_type: 'business_metric',
      event_name: metric_name,
      properties: {
        value,
        context: context ?? {},
        anonymized: true,
      },
      timestamp: new Date(),
      session_id: this.consentManager.getSessionId(),
      user_consent: consent,
      anonymized: true,
    };

    this.addEvent(event);
    this.updateMetrics('business', { metric_name, value, context });
    void this.sendEventToEndpoint(event);
  }

  /**
   * ⚡ Tracking performance
   */
  trackPerformance(metric_name: string, timing: number): void {
    const consent = this.consentManager.getConsent();
    if (!consent?.analytics) return;

    const event: AnalyticsEvent = {
      event_type: 'performance_metric',
      event_name: metric_name,
      properties: {
        timing,
        url: this.anonymizePath(window.location.pathname),
        connection_type:
          (navigator as unknown as { connection?: { effectiveType?: string } })
            .connection?.effectiveType ?? 'unknown',
      },
      timestamp: new Date(),
      session_id: this.consentManager.getSessionId(),
      user_consent: consent,
      anonymized: true,
    };

    this.addEvent(event);
    this.updateMetrics('performance', { metric_name, timing });
    void this.sendEventToEndpoint(event);
  }

  /**
   * 🔒 Filtrage propriétés selon consent
   */
  private filterPropertiesByConsent(
    properties: Record<string, unknown>,
    consent: ConsentLevel
  ): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    // Propriétés toujours autorisées (necessary)
    const allowedKeys = ['action', 'category', 'value', 'path', 'duration'];

    // Propriétés analytics (si consent analytics)
    if (consent.analytics) {
      allowedKeys.push(
        'user_agent',
        'referrer',
        'language',
        'viewport',
        'session_duration'
      );
    }

    // Propriétés marketing (si consent marketing)
    if (consent.marketing) {
      allowedKeys.push('user_id', 'campaign', 'source', 'medium', 'content');
    }

    // Filtrer les propriétés
    Object.keys(properties).forEach(key => {
      if (allowedKeys.includes(key)) {
        filtered[key] = properties[key];
      }
    });

    return filtered;
  }

  /**
   * 🔐 Anonymisation données
   */
  private anonymizePath(path: string): string {
    // Supprimer IDs potentiellement sensibles
    return path
      .replace(
        /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        '/[id]'
      )
      .replace(/\/\d+/g, '/[id]');
  }

  private anonymizeReferrer(referrer: string): string {
    if (!referrer) return '';
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }

  private anonymizeUserAgent(userAgent: string): string {
    // Garder seulement browser + OS, supprimer données précises
    const browser = userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
          ? 'Safari'
          : 'Other';

    const os = userAgent.includes('Windows')
      ? 'Windows'
      : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Linux')
          ? 'Linux'
          : 'Other';

    return `${browser}/${os}`;
  }

  /**
   * 📊 Initialisation métriques
   */
  private initializeMetrics(): BusinessMetrics {
    return {
      catalogue_usage: {
        products_viewed: 0,
        collections_created: 0,
        pdfs_generated: 0,
        shares_completed: 0,
      },
      performance_metrics: {
        avg_load_time: 0,
        core_web_vitals: {
          lcp: 0,
          fid: 0,
          cls: 0,
        },
      },
      user_journey: {
        entry_page: '',
        exit_page: '',
        session_duration: 0,
        pages_visited: 0,
      },
    };
  }

  /**
   * 📈 Mise à jour métriques
   */
  private updateMetrics(type: string, data: Record<string, unknown>): void {
    switch (type) {
      case 'page_view':
        this.metrics.user_journey.pages_visited++;
        break;
      case 'business':
        if (
          typeof data.metric_name === 'string' &&
          data.metric_name.includes('product_view')
        ) {
          this.metrics.catalogue_usage.products_viewed++;
        }
        break;
      case 'performance':
        if (data.metric_name === 'page_load_time') {
          this.metrics.performance_metrics.avg_load_time =
            data.timing as number;
        }
        break;
    }
  }

  /**
   * 📤 Envoi événement vers endpoint
   */
  private async sendEventToEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      // Envoi vers API analytics interne (respectueuse GDPR)
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('[Analytics] Failed to send event:', error);
    }
  }

  /**
   * 📋 Ajout événement local
   */
  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Limiter historique local (protection mémoire)
    if (this.events.length > 100) {
      this.events = this.events.slice(-50);
    }
  }

  /**
   * 🎧 Configuration listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listener consent updates
    window.addEventListener('gdpr_consent_updated', (event: Event) => {
      const customEvent = event as CustomEvent<{ consent?: ConsentLevel }>;
      const consent = customEvent.detail?.consent;
      if (consent?.analytics && !this.isInitialized) {
        void this.initialize();
      }
    });

    // Performance monitoring
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance(
            'page_load_time',
            navigation.loadEventEnd - navigation.fetchStart
          );
        }
      }, 0);
    });

    // Page visibility (respect vie privée)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Session cleanup si nécessaire
        void this.flushEvents();
      }
    });
  }

  /**
   * 📤 Envoi événements en attente
   */
  private async flushEvents(): Promise<void> {
    const consent = this.consentManager.getConsent();
    if (!consent?.analytics) return;

    // Envoi batch événements
    if (this.events.length > 0) {
      try {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: this.events,
            session_id: this.consentManager.getSessionId(),
          }),
        });
        this.events = [];
      } catch (error) {
        console.warn('[Analytics] Failed to flush events:', error);
      }
    }
  }

  /**
   * 📊 Obtenir métriques actuelles
   */
  getMetrics(): BusinessMetrics {
    return { ...this.metrics };
  }

  /**
   * 🔧 Obtenir gestionnaire consent
   */
  getConsentManager(): GDPRConsentManager {
    return this.consentManager;
  }
}

/**
 * 🎯 Instance globale analytics
 */
export const gdprAnalytics = new GDPRAnalytics();

/**
 * 🚀 Helpers utilisation
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  gdprAnalytics.track(name, properties);
}

export function trackPageView(path?: string): void {
  gdprAnalytics.trackPageView(path ?? window.location.pathname);
}

export function trackBusinessMetric(
  name: string,
  value: number,
  context?: Record<string, unknown>
): void {
  gdprAnalytics.trackBusinessMetric(name, value, context);
}

export function setUserConsent(consent: ConsentLevel): void {
  gdprAnalytics.getConsentManager().setConsent(consent);
}
