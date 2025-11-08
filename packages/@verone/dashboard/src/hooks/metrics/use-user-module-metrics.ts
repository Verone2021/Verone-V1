/**
 * 📊 Hook User Module Metrics - Vérone
 *
 * Récupère les métriques d'utilisation par module pour un utilisateur spécifique
 * (Organisation, Achats, Stocks, Catalogue, Ventes, CRM)
 *
 * @version 2.0 - Données réelles user_activity_logs
 */

'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface ModuleUsageMetric {
  module: string;
  page_views: number;
  total_actions: number;
  time_spent_minutes: number;
  percentage: number;
  last_visited: Date | null;
  icon: string;
  color: string;
}

interface UserModuleMetricsData {
  modules: ModuleUsageMetric[];
  total_time: number;
  total_page_views: number;
  loading: boolean;
  error: string | null;
}

/**
 * Helper: Extraire le module depuis page_url
 * Exemples:
 *  - '/dashboard' → 'dashboard'
 *  - '/catalogue/produits' → 'catalogue'
 *  - '/commandes/fournisseurs' → 'commandes'
 */
function extractModuleFromUrl(pageUrl: string | null): string | null {
  if (!pageUrl) return null;

  // Extraire première partie du path (après le premier /)
  const match = pageUrl.match(/^\/([^\/]+)/);
  if (!match) return null;

  return match[1];
}

/**
 * Module mapping configuration
 * Maps internal module names to display names and styling
 */
const MODULE_CONFIG: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  dashboard: { name: 'Dashboard', icon: 'Home', color: 'blue' },
  catalogue: { name: 'Catalogue', icon: 'BookOpen', color: 'purple' },
  stocks: { name: 'Stocks', icon: 'Package', color: 'green' },
  sourcing: { name: 'Sourcing', icon: 'Target', color: 'amber' },
  interactions: { name: 'Ventes', icon: 'ShoppingBag', color: 'pink' }, // Ventes = interactions (mapping sidebar)
  commandes: { name: 'Achats', icon: 'Truck', color: 'orange' }, // Achats = commandes (mapping sidebar)
  'canaux-vente': { name: 'Canaux de vente', icon: 'Globe', color: 'cyan' }, // Canaux de vente (Google Merchant, etc.)
  finance: { name: 'Facturation', icon: 'Wallet', color: 'indigo' }, // Finance module (Phase 2 désactivé sidebar)
  contacts: { name: 'Organisation', icon: 'Building2', color: 'teal' }, // Organisation = contacts (mapping sidebar)
  parametres: { name: 'Paramètres', icon: 'Settings', color: 'gray' },
};

/**
 * Hook principal: Récupère les métriques par module
 */
export function useUserModuleMetrics(
  userId: string,
  days: number = 30
): UserModuleMetricsData {
  const [modules, setModules] = useState<ModuleUsageMetric[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModuleMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Calculer date limite (days ago)
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);

        // 📊 QUERY 1: Récupérer toutes les activités de l'utilisateur
        // NOTE: Colonne 'module' n'existe pas! On extrait depuis page_url
        const { data: activities, error: activitiesError } = await supabase
          .from('user_activity_logs')
          .select('page_url, action, created_at, new_data')
          .eq('user_id', userId)
          .gte('created_at', daysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (activitiesError) {
          throw new Error(
            `Erreur fetch activities: ${activitiesError.message}`
          );
        }

        if (!activities || activities.length === 0) {
          // Aucune activité trouvée
          setModules([]);
          setTotalTime(0);
          setTotalPageViews(0);
          setLoading(false);
          return;
        }

        // 📈 AGGREGATION: Calculer métriques par module
        const moduleStats: Record<
          string,
          {
            page_views: number;
            actions: number;
            last_visited: Date;
            time_spent: number;
          }
        > = {};

        activities.forEach((activity, index) => {
          // Extraire le module depuis page_url (ex: '/dashboard' → 'dashboard')
          const moduleName =
            extractModuleFromUrl(activity.page_url) || 'autres';

          if (!moduleStats[moduleName]) {
            moduleStats[moduleName] = {
              page_views: 0,
              actions: 0,
              last_visited: new Date(
                activity.created_at || new Date().toISOString()
              ),
              time_spent: 0,
            };
          }

          // Comptage actions
          moduleStats[moduleName].actions++;

          // Page views (on compte si action = 'page_view' ou 'navigation')
          if (
            activity.action === 'page_view' ||
            activity.action === 'navigation' ||
            activity.action === 'view'
          ) {
            moduleStats[moduleName].page_views++;
          }

          // Last visited (date la plus récente)
          const activityDate = new Date(
            activity.created_at || new Date().toISOString()
          );
          if (activityDate > moduleStats[moduleName].last_visited) {
            moduleStats[moduleName].last_visited = activityDate;
          }

          // Estimation temps passé:
          // Si on a l'action suivante, calculer différence entre timestamps
          // Sinon, estimer 2 minutes par action (moyenne)
          if (index < activities.length - 1) {
            const nextActivity = activities[index + 1];
            const timeDiff =
              new Date(
                activity.created_at || new Date().toISOString()
              ).getTime() -
              new Date(
                nextActivity.created_at || new Date().toISOString()
              ).getTime();

            // Limiter à 30 minutes max entre 2 actions (sinon session terminée)
            if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
              moduleStats[moduleName].time_spent += timeDiff / 1000 / 60; // Convertir en minutes
            } else {
              moduleStats[moduleName].time_spent += 2; // Estimation 2 min par action
            }
          } else {
            moduleStats[moduleName].time_spent += 2; // Dernière action: estimer 2 min
          }
        });

        // 🧮 CALCUL: Total temps et page views
        const total_time_calc = Object.values(moduleStats).reduce(
          (sum, stat) => sum + stat.time_spent,
          0
        );
        const total_page_views_calc = Object.values(moduleStats).reduce(
          (sum, stat) => sum + stat.page_views,
          0
        );

        // 📊 TRANSFORMATION: Créer array de modules avec pourcentages
        const modulesArray: ModuleUsageMetric[] = Object.entries(moduleStats)
          .map(([module, stats]) => {
            const config = MODULE_CONFIG[module] || {
              name: module,
              icon: 'Circle',
              color: 'gray',
            };

            return {
              module: config.name,
              page_views: stats.page_views,
              total_actions: stats.actions,
              time_spent_minutes: Math.round(stats.time_spent),
              percentage:
                total_time_calc > 0
                  ? Math.round((stats.time_spent / total_time_calc) * 100)
                  : 0,
              last_visited: stats.last_visited,
              icon: config.icon,
              color: config.color,
            };
          })
          .sort((a, b) => b.time_spent_minutes - a.time_spent_minutes); // Trier par temps décroissant

        setModules(modulesArray);
        setTotalTime(Math.round(total_time_calc));
        setTotalPageViews(total_page_views_calc);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        console.error('❌ Erreur fetch module metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchModuleMetrics();
    }
  }, [userId, days]);

  return {
    modules,
    total_time: totalTime,
    total_page_views: totalPageViews,
    loading,
    error,
  };
}

/**
 * Hook helper: Formater temps en format lisible
 */
export function formatModuleTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

/**
 * Hook helper: Couleur barre de progression selon pourcentage
 */
export function getProgressBarColor(
  percentage: number,
  baseColor: string
): string {
  // Retourner classe Tailwind pour la couleur
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-600',
    teal: 'bg-teal-600',
    cyan: 'bg-cyan-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-600',
  };

  return colorMap[baseColor] || 'bg-black';
}
