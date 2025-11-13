/**
 * Hook: useVercelAnalytics
 * Récupère métriques Vercel Analytics
 *
 * Documentation API Vercel Analytics:
 * https://vercel.com/docs/analytics/api
 */

import { useQuery } from '@tanstack/react-query';

import type { VercelAnalyticsMetrics } from '../types';

/**
 * Fetch métriques Vercel Analytics via API
 *
 * TODO: Implémenter appel réel API Vercel
 * - Nécessite token API Vercel dans env vars
 * - Endpoint: https://vercel.com/api/v1/analytics/...
 */
async function fetchVercelAnalytics(): Promise<VercelAnalyticsMetrics | null> {
  // TODO: Remplacer par appel API réel
  // const response = await fetch('/api/vercel-analytics', {
  //   method: 'GET',
  //   headers: {
  //     Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
  //   },
  // });
  //
  // if (!response.ok) throw new Error('Erreur fetch Vercel Analytics');
  //
  // return response.json();

  // Mock data pour développement
  return {
    pageviews: 12453,
    uniqueVisitors: 8934,
    bounceRate: 42.3,
    avgSessionDuration: 245, // secondes

    // Web Vitals
    lcp: 1.2, // secondes (< 2.5s = good)
    fid: 45, // ms (< 100ms = good)
    cls: 0.08, // (< 0.1 = good)
    ttfb: 320, // ms
    fcp: 0.9, // secondes

    // Top Pages
    topPages: [
      { path: '/', pageviews: 3245, uniqueVisitors: 2456 },
      { path: '/catalogue', pageviews: 2893, uniqueVisitors: 2134 },
      { path: '/produit/fauteuil-milo', pageviews: 1567, uniqueVisitors: 1234 },
      { path: '/collection/salon', pageviews: 1234, uniqueVisitors: 987 },
      { path: '/panier', pageviews: 987, uniqueVisitors: 743 },
    ],

    // Devices
    devices: {
      mobile: 6543,
      desktop: 4321,
      tablet: 1589,
    },

    // Time series (30 derniers jours)
    timeSeries: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      pageviews: Math.floor(Math.random() * 500) + 300,
      uniqueVisitors: Math.floor(Math.random() * 350) + 200,
    })),
  };
}

/**
 * Hook principal: récupère métriques Vercel Analytics
 */
export function useVercelAnalytics() {
  return useQuery({
    queryKey: ['vercel-analytics'],
    queryFn: fetchVercelAnalytics,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refresh toutes les 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Helper: Évaluation Web Vitals
 */
export function getWebVitalRating(
  metric: 'lcp' | 'fid' | 'cls',
  value: number
): {
  rating: 'good' | 'needs-improvement' | 'poor';
  color: string;
} {
  const thresholds = {
    lcp: { good: 2.5, poor: 4.0 }, // secondes
    fid: { good: 100, poor: 300 }, // ms
    cls: { good: 0.1, poor: 0.25 }, // score
  };

  const { good, poor } = thresholds[metric];

  if (value <= good) {
    return { rating: 'good', color: 'green' };
  } else if (value <= poor) {
    return { rating: 'needs-improvement', color: 'orange' };
  } else {
    return { rating: 'poor', color: 'red' };
  }
}

/**
 * Helper: Formater durée (secondes → mm:ss)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
