/**
 * 📊 Hook - Métriques Stock & Commandes Dashboard (Best Practices 2025)
 *
 * Récupère les métriques calculées par Supabase avec :
 * ✅ Timeout 10s (AbortController)
 * ✅ Retry automatique 3x (exponential backoff)
 * ✅ Messages d'erreur UX-friendly
 * ✅ Logging structuré pour debugging
 * ✅ Cleanup proper (éviter memory leaks)
 *
 * Métriques :
 * - Valeur Stock (€)
 * - Commandes Achat (nombre)
 * - CA du Mois (€)
 * - Produits à Sourcer (nombre)
 *
 * Pattern inspiré de : TanStack Query, SWR, Next.js docs 2025
 */

import { useEffect, useState, useRef } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface StockOrdersMetrics {
  stock_value: number;
  purchase_orders_count: number;
  month_revenue: number;
  products_to_source: number;
}

interface UseStockOrdersMetricsReturn {
  metrics: StockOrdersMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const FETCH_CONFIG = {
  TIMEOUT_MS: 10000, // 10s timeout (Next.js 15 recommendation)
  MAX_RETRIES: 3, // 3 tentatives maximum (Vercel pattern)
  BASE_DELAY_MS: 1000, // 1s délai initial pour retry
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcule le délai d'attente pour retry avec exponential backoff
 * Pattern: AWS SDK, Vercel, Stripe
 */
function getRetryDelay(retryCount: number): number {
  return FETCH_CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Messages d'erreur user-friendly selon le type d'erreur
 * Pattern: Nielsen UX guidelines 2025
 */
function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    if (
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch')
    ) {
      return 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
    }
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'La requête a pris trop de temps. Le serveur ne répond pas.';
    }
    // Si erreur contient déjà un message technique, le garder
    return error.message;
  }

  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

// ============================================================================
// HOOK
// ============================================================================

export function useStockOrdersMetrics(): UseStockOrdersMetricsReturn {
  const [metrics, setMetrics] = useState<StockOrdersMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour cleanup (éviter setState sur composant démonté)
  const isMountedRef = useRef(true);
  // Ref pour AbortController cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch avec retry automatique et timeout
   * Pattern: Vercel Edge Runtime, AWS Amplify
   */
  const fetchMetrics = async (retryCount = 0) => {
    // Cleanup previous request si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer nouveau AbortController pour cette requête
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout avec AbortController (Web API standard)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, FETCH_CONFIG.TIMEOUT_MS);

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      const response = await fetch('/api/dashboard/stock-orders-metrics', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Vérifier status AVANT json() (éviter erreur parsing)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error ||
            `Erreur serveur (${response.status}): ${response.statusText}`
        );
      }

      const data = await response.json();

      if (isMountedRef.current) {
        setMetrics(data.metrics);
        setIsLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);

      // ✅ RETRY LOGIC - Exponential backoff (pattern AWS/Vercel)
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error && err.name === 'AbortError');

      const shouldRetry =
        isNetworkError && retryCount < FETCH_CONFIG.MAX_RETRIES;

      if (shouldRetry) {
        const delay = getRetryDelay(retryCount);
        // Silencer le log pour AbortError (cleanup intentionnel)
        if (!(err instanceof Error && err.name === 'AbortError')) {
          console.warn(
            `[useStockOrdersMetrics] Retry ${retryCount + 1}/${FETCH_CONFIG.MAX_RETRIES} dans ${delay}ms`,
            err
          );
        }

        // Attendre avant retry
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry récursif
        return fetchMetrics(retryCount + 1);
      }

      // ✅ ERROR HANDLING - Messages UX-friendly
      const userMessage = getUserFriendlyErrorMessage(err);

      if (isMountedRef.current) {
        setError(userMessage);
        setIsLoading(false);
      }

      // ✅ LOGGING - Format structuré pour debugging
      console.error('[useStockOrdersMetrics] Erreur après tentatives:', {
        error: err,
        retryCount,
        maxRetries: FETCH_CONFIG.MAX_RETRIES,
        userMessage,
      });
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // ✅ FIX: Vérifier authentification AVANT fetch (Console Zero Tolerance)
    const checkAuthAndFetch = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Si pas d'utilisateur, ne pas fetcher et retourner état neutre
      if (!user) {
        if (isMountedRef.current) {
          setIsLoading(false);
          setError(null); // Pas d'erreur si simplement déconnecté
        }
        return;
      }

      // Utilisateur authentifié → fetcher les métriques
      fetchMetrics();
    };

    checkAuthAndFetch();

    // ✅ CLEANUP - Éviter memory leaks (pattern React 18+)
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
