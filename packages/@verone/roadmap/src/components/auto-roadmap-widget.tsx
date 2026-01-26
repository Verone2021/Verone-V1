/**
 * AutoRoadmapWidget - Widget dashboard pour afficher la roadmap auto-générée
 *
 * Affiche les tâches prioritaires basées sur le scoring RICE avec :
 * - Liste triée par priorité
 * - Indicateurs visuels de priorité
 * - Actions directes vers les pages concernées
 * - Stats récapitulatives
 *
 * Design System 2026 - Minimaliste, professionnel
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Target,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Layers,
  MessageCircle,
  Link2,
  Package,
  Building2,
  ShoppingBag,
  Wallet,
  Zap,
  TrendingUp,
} from 'lucide-react';

import { useAutoRoadmap, type UseAutoRoadmapOptions } from '../hooks/use-auto-roadmap';
import type { RoadmapTask } from '../lib/roadmap-engine';

/**
 * Configuration des icônes par catégorie
 */
const CATEGORY_ICONS: Record<string, typeof Package> = {
  stock: Layers,
  consultations: MessageCircle,
  linkme: Link2,
  organisations: Building2,
  commandes: ShoppingBag,
  finance: Wallet,
};

/**
 * Configuration des couleurs par priorité
 */
const PRIORITY_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  critical: {
    label: 'Critique',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  high: {
    label: 'Haute',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  medium: {
    label: 'Moyenne',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  low: {
    label: 'Basse',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
  },
};

interface RoadmapTaskItemProps {
  task: RoadmapTask;
  index: number;
}

/**
 * Item individuel de tâche roadmap
 */
function RoadmapTaskItem({ task, index }: RoadmapTaskItemProps) {
  const Icon = CATEGORY_ICONS[task.category] || Package;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <Link
      href={task.actionUrl}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2',
        priorityConfig.borderColor
      )}
    >
      {/* Numéro de priorité */}
      <div
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0',
          priorityConfig.bgColor,
          priorityConfig.color
        )}
      >
        {index + 1}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4 flex-shrink-0', priorityConfig.color)} />
          <span className="font-medium text-sm truncate">{task.title}</span>
        </div>

        <p className="text-xs text-black/60 mt-0.5 line-clamp-1">
          {task.description}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            className={cn(
              'text-[10px] px-1.5 py-0 font-medium',
              priorityConfig.bgColor,
              priorityConfig.color
            )}
          >
            {priorityConfig.label}
          </Badge>
          <span className="text-[10px] text-black/40 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Score: {task.rice.score.toFixed(1)}
          </span>
          <span className="text-[10px] text-black/40">
            ~{task.rice.effortHours}h
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1 text-xs text-black/40 group-hover:text-black transition-colors">
        <span className="hidden sm:inline">{task.actionLabel}</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

interface AutoRoadmapWidgetProps extends UseAutoRoadmapOptions {
  /** Titre du widget */
  title?: string;
  /** Description du widget */
  description?: string;
  /** Afficher les stats */
  showStats?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

/**
 * Widget Auto-Roadmap pour le dashboard
 *
 * Affiche automatiquement les tâches prioritaires basées sur les alertes
 * et badges du système.
 *
 * @example
 * ```tsx
 * <AutoRoadmapWidget
 *   minPriority="medium"
 *   maxTasks={5}
 *   showStats
 * />
 * ```
 */
export function AutoRoadmapWidget({
  title = 'Feuille de Route',
  description,
  showStats = false,
  className,
  ...options
}: AutoRoadmapWidgetProps) {
  const {
    tasks,
    totalCount,
    loading,
    error,
    stats,
    refetch,
  } = useAutoRoadmap(options);

  const dynamicDescription = description ||
    (tasks.length > 0
      ? `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} prioritaire${tasks.length > 1 ? 's' : ''} basée${tasks.length > 1 ? 's' : ''} sur vos alertes`
      : 'Aucune action requise');

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-black" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>
        <CardDescription className="text-xs">
          {dynamicDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats optionnelles */}
        {showStats && tasks.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b">
            {Object.entries(stats.byPriority).map(([priority, count]) => {
              const config = PRIORITY_CONFIG[priority];
              return (
                <div
                  key={priority}
                  className={cn(
                    'text-center p-1.5 rounded-md',
                    config?.bgColor || 'bg-gray-50'
                  )}
                >
                  <div className={cn('text-lg font-bold', config?.color)}>
                    {count}
                  </div>
                  <div className="text-[10px] text-black/60">
                    {config?.label || priority}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Liste des tâches */}
        <ScrollArea className="max-h-64">
          {loading && tasks.length === 0 ? (
            <div className="space-y-3 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune action requise</p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les tâches sont à jour
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map((task, index) => (
                <RoadmapTaskItem key={task.id} task={task} index={index} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Score total */}
        {showStats && tasks.length > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-black/50">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Score RICE total: {stats.totalRiceScore.toFixed(1)}
            </span>
            <span>
              {totalCount} tâche{totalCount > 1 ? 's' : ''} générée{totalCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
