/**
 * GDPR-Compliant Analytics System - Vérone 2025
 * Instance globale + helpers d'utilisation
 * Conforme RGPD français + business intelligence sans compromis
 */

export type {
  AnalyticsEvent,
  ConsentLevel,
  UserSession,
  BusinessMetrics,
} from './gdpr-analytics-consent';
export { GDPRConsentManager } from './gdpr-analytics-consent';
export { GDPRAnalytics } from './gdpr-analytics-engine';

import { GDPRAnalytics } from './gdpr-analytics-engine';
import type { ConsentLevel } from './gdpr-analytics-consent';

/**
 * Instance globale analytics
 */
export const gdprAnalytics = new GDPRAnalytics();

/**
 * Helpers utilisation
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
