'use client';

/**
 * KPISelectorModal
 *
 * Modal pour sélectionner un KPI à ajouter au dashboard.
 * Affiche les 26 KPIs du catalogue, filtrables par catégorie.
 *
 * Règles:
 * - Onglet Aperçu = tous les KPIs autorisés
 * - Autres onglets = KPIs de leur catégorie uniquement
 * - KPIs déjà présents marqués avec Check et désactivés
 *
 * @module KPISelectorModal
 * @since 2026-01-12
 */

import React, { useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from '@verone/ui';
import { cn } from '@verone/ui';
import { Plus, Check } from 'lucide-react';

import type { DashboardTab } from './dashboard-tabs';
import {
  KPI_CATALOG,
  type KPICategory,
  CATEGORY_LABELS,
} from '../lib/kpi-catalog';

// ============================================================================
// Types
// ============================================================================

interface KPISelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTab: DashboardTab;
  existingKpiIds: string[];
  onAddKpi: (kpiId: string) => void;
}

// ============================================================================
// Mapping onglet → catégories autorisées
// ============================================================================

const TAB_TO_CATEGORIES: Record<DashboardTab, KPICategory[] | 'all'> = {
  apercu: 'all', // Aperçu peut avoir tous les KPIs
  ventes: ['sales'],
  stock: ['stock'],
  finances: ['finance'],
  linkme: ['linkme'],
};

// ============================================================================
// Composant
// ============================================================================

export function KPISelectorModal({
  open,
  onOpenChange,
  currentTab,
  existingKpiIds,
  onAddKpi,
}: KPISelectorModalProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<KPICategory | 'all'>(
    'all'
  );

  // Filtrer les KPIs selon l'onglet actif
  const availableKpis = useMemo(() => {
    const allowedCategories = TAB_TO_CATEGORIES[currentTab];

    return Object.values(KPI_CATALOG).filter(kpi => {
      if (allowedCategories === 'all') return true;
      return allowedCategories.includes(kpi.category);
    });
  }, [currentTab]);

  // Filtrer par catégorie sélectionnée
  const filteredKpis = useMemo(() => {
    if (selectedCategory === 'all') return availableKpis;
    return availableKpis.filter(kpi => kpi.category === selectedCategory);
  }, [availableKpis, selectedCategory]);

  // Catégories disponibles pour le filtre
  const availableCategories = useMemo(() => {
    const categories = new Set(availableKpis.map(kpi => kpi.category));
    return Array.from(categories);
  }, [availableKpis]);

  // Handler pour ajouter un KPI
  const handleAddKpi = (kpiId: string) => {
    onAddKpi(kpiId);
    onOpenChange(false);
  };

  // Tab label pour l'affichage
  const tabLabel =
    currentTab === 'apercu'
      ? 'Aperçu'
      : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un KPI</DialogTitle>
          <DialogDescription>
            Sélectionnez un KPI à ajouter à l&apos;onglet {tabLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2 py-3 border-b">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Tous ({availableKpis.length})
          </Button>
          {availableCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {CATEGORY_LABELS[category]} (
              {availableKpis.filter(k => k.category === category).length})
            </Button>
          ))}
        </div>

        {/* Liste des KPIs */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredKpis.map(kpi => {
              const isAlreadyAdded = existingKpiIds.includes(kpi.id);
              const Icon = kpi.icon;

              return (
                <div
                  key={kpi.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    isAlreadyAdded
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                  )}
                  onClick={() => !isAlreadyAdded && handleAddKpi(kpi.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        kpi.category === 'sales' && 'bg-blue-100 text-blue-600',
                        kpi.category === 'stock' &&
                          'bg-purple-100 text-purple-600',
                        kpi.category === 'finance' &&
                          'bg-green-100 text-green-600',
                        kpi.category === 'linkme' &&
                          'bg-orange-100 text-orange-600',
                        kpi.category === 'general' &&
                          'bg-slate-100 text-slate-600'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {kpi.label}
                        </p>
                        {isAlreadyAdded && (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {kpi.description}
                      </p>
                    </div>
                    {!isAlreadyAdded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={e => {
                          e.stopPropagation();
                          handleAddKpi(kpi.id);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message si aucun KPI disponible */}
          {filteredKpis.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>Aucun KPI disponible dans cette catégorie</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KPISelectorModal;
