/**
 * Hook Auto-Roadmap - Génère automatiquement une roadmap basée sur les badges
 *
 * Combine les données des hooks de notifications pour générer une liste
 * de tâches prioritaires via le moteur RICE.
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useMemo } from 'react';

import {
  useStockAlertsCount,
  useConsultationsCount,
  useLinkmePendingCount,
} from '@verone/notifications';

import {
  generateRoadmap,
  filterByPriority,
  limitTasks,
  type BadgeData,
  type RoadmapTask,
} from '../lib/roadmap-engine';

export interface UseAutoRoadmapOptions {
  /** Priorité minimum des tâches à inclure (default: 'low') */
  minPriority?: RoadmapTask['priority'];
  /** Nombre maximum de tâches à retourner (default: 10) */
  maxTasks?: number;
  /** Activer le refresh automatique des badges (default: true) */
  enableRealtime?: boolean;
}

export interface UseAutoRoadmapReturn {
  /** Liste des tâches triées par score RICE */
  tasks: RoadmapTask[];
  /** Nombre total de tâches générées (avant filtrage) */
  totalCount: number;
  /** Données des badges sources */
  badges: BadgeData[];
  /** Chargement en cours */
  loading: boolean;
  /** Erreur éventuelle */
  error: Error | null;
  /** Statistiques par catégorie */
  stats: {
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    totalRiceScore: number;
  };
  /** Force le refresh des données */
  refetch: () => Promise<void>;
}

/**
 * Hook pour générer automatiquement une roadmap de tâches prioritaires
 *
 * Utilise les hooks de notifications pour collecter les données des badges
 * et génère une liste de tâches via le moteur RICE.
 *
 * @example
 * ```tsx
 * function RoadmapWidget() {
 *   const { tasks, loading, stats } = useAutoRoadmap({
 *     minPriority: 'medium',
 *     maxTasks: 5,
 *   });
 *
 *   return (
 *     <ul>
 *       {tasks.map(task => (
 *         <li key={task.id}>
 *           {task.title} (Score: {task.rice.score.toFixed(1)})
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useAutoRoadmap(
  options?: UseAutoRoadmapOptions
): UseAutoRoadmapReturn {
  const {
    minPriority = 'low',
    maxTasks = 10,
    enableRealtime = true,
  } = options || {};

  // Collecter les données des badges via les hooks existants
  const {
    count: stockCount,
    loading: stockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useStockAlertsCount({ enableRealtime });

  const {
    count: consultationsCount,
    loading: consultationsLoading,
    error: consultationsError,
    refetch: refetchConsultations,
  } = useConsultationsCount({ enableRealtime });

  const {
    count: linkmeCount,
    loading: linkmeLoading,
    error: linkmeError,
    refetch: refetchLinkme,
  } = useLinkmePendingCount({ enableRealtime });

  // Construire les badges
  const badges = useMemo<BadgeData[]>(() => {
    const badgeList: BadgeData[] = [];

    if (stockCount > 0) {
      badgeList.push({
        source: 'stock',
        count: stockCount,
        severity:
          stockCount >= 5 ? 'urgent' : stockCount >= 2 ? 'warning' : 'info',
      });
    }

    if (consultationsCount > 0) {
      badgeList.push({
        source: 'consultations',
        count: consultationsCount,
        severity:
          consultationsCount >= 5
            ? 'urgent'
            : consultationsCount >= 2
              ? 'warning'
              : 'info',
      });
    }

    if (linkmeCount > 0) {
      badgeList.push({
        source: 'linkme',
        count: linkmeCount,
        severity:
          linkmeCount >= 5 ? 'urgent' : linkmeCount >= 2 ? 'warning' : 'info',
      });
    }

    return badgeList;
  }, [stockCount, consultationsCount, linkmeCount]);

  // Générer la roadmap
  const { tasks, totalCount, stats } = useMemo(() => {
    // Générer toutes les tâches
    const allTasks = generateRoadmap(badges);
    const total = allTasks.length;

    // Filtrer et limiter
    const filteredTasks = filterByPriority(allTasks, minPriority);
    const limitedTasks = limitTasks(filteredTasks, maxTasks);

    // Calculer les stats
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalRiceScore = 0;

    for (const task of allTasks) {
      byCategory[task.category] = (byCategory[task.category] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      totalRiceScore += task.rice.score;
    }

    return {
      tasks: limitedTasks,
      totalCount: total,
      stats: {
        byCategory,
        byPriority,
        totalRiceScore,
      },
    };
  }, [badges, minPriority, maxTasks]);

  // États dérivés
  const loading = stockLoading || consultationsLoading || linkmeLoading;
  const error = stockError || consultationsError || linkmeError;

  // Refresh function
  const refetch = async () => {
    await Promise.all([
      refetchStock(),
      refetchConsultations(),
      refetchLinkme(),
    ]);
  };

  return {
    tasks,
    totalCount,
    badges,
    loading,
    error,
    stats,
    refetch,
  };
}
