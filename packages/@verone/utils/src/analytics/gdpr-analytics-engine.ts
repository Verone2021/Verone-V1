/**
 * GDPR Analytics Engine - Vérone 2025
 * Collecte analytics respectueuse avec anonymisation
 */

import type {
  AnalyticsEvent,
  BusinessMetrics,
  ConsentLevel,
} from './gdpr-analytics-consent';
import { GDPRConsentManager } from './gdpr-analytics-consent';

/**
 * Analytics Engine GDPR-Compliant
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

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const consent = this.consentManager.getConsent();
    if (!consent) {
      console.warn('[Analytics] Waiting for user consent...');
      return;
    }

    this.isInitialized = true;
    console.warn('[Analytics] Initialized with GDPR compliance');

    if (this.consentManager.canTrack('analytics')) {
      this.trackPageView(window.location.pathname);
    }
  }

  track(event_name: string, properties: Record<string, unknown> = {}): void {
    const consent = this.consentManager.getConsent();
    if (!consent) return;

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

    if (consent.analytics) {
      void this.sendEventToEndpoint(event);
    }
  }

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

  getMetrics(): BusinessMetrics {
    return { ...this.metrics };
  }

  getConsentManager(): GDPRConsentManager {
    return this.consentManager;
  }

  private filterPropertiesByConsent(
    properties: Record<string, unknown>,
    consent: ConsentLevel
  ): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    const allowedKeys = ['action', 'category', 'value', 'path', 'duration'];

    if (consent.analytics) {
      allowedKeys.push(
        'user_agent',
        'referrer',
        'language',
        'viewport',
        'session_duration'
      );
    }

    if (consent.marketing) {
      allowedKeys.push('user_id', 'campaign', 'source', 'medium', 'content');
    }

    Object.keys(properties).forEach(key => {
      if (allowedKeys.includes(key)) {
        filtered[key] = properties[key];
      }
    });

    return filtered;
  }

  private anonymizePath(path: string): string {
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
        core_web_vitals: { lcp: 0, fid: 0, cls: 0 },
      },
      user_journey: {
        entry_page: '',
        exit_page: '',
        session_duration: 0,
        pages_visited: 0,
      },
    };
  }

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

  private async sendEventToEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('[Analytics] Failed to send event:', error);
    }
  }

  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > 100) {
      this.events = this.events.slice(-50);
    }
  }

  private async flushEvents(): Promise<void> {
    const consent = this.consentManager.getConsent();
    if (!consent?.analytics) return;

    if (this.events.length > 0) {
      try {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('gdpr_consent_updated', (event: Event) => {
      const customEvent = event as CustomEvent<{ consent?: ConsentLevel }>;
      const consent = customEvent.detail?.consent;
      if (consent?.analytics && !this.isInitialized) {
        void this.initialize();
      }
    });

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

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void this.flushEvents();
      }
    });
  }
}
