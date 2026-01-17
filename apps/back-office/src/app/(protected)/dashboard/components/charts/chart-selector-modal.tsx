'use client';

/**
 * Modal de sélection de graphiques pour le dashboard
 * Permet d'ajouter/retirer des graphiques de l'onglet actif
 *
 * @created 2026-01-12
 */

import { useState, useMemo } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
  Badge,
} from '@verone/ui';
import { Check, Search } from 'lucide-react';

import {
  CHART_CATALOG,
  CHART_TYPE_LABELS,
  type ChartDefinition,
} from '../../lib/chart-catalog';
import { CATEGORY_LABELS, type KPICategory } from '../../lib/kpi-catalog';

interface ChartSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharts: string[];
  onChartsChange: (charts: string[]) => void;
  maxCharts?: number;
}

export function ChartSelectorModal({
  open,
  onOpenChange,
  selectedCharts,
  onChartsChange,
  maxCharts = 4,
}: ChartSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | KPICategory>(
    'all'
  );

  // Filtrer les graphiques par recherche et catégorie
  const filteredCharts = useMemo(() => {
    return Object.values(CHART_CATALOG).filter(chart => {
      const matchesSearch =
        search === '' ||
        chart.label.toLowerCase().includes(search.toLowerCase()) ||
        chart.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === 'all' || chart.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  // Toggle un graphique
  const toggleChart = (chartId: string) => {
    if (selectedCharts.includes(chartId)) {
      onChartsChange(selectedCharts.filter(id => id !== chartId));
    } else if (selectedCharts.length < maxCharts) {
      onChartsChange([...selectedCharts, chartId]);
    }
  };

  const isMaxReached = selectedCharts.length >= maxCharts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des graphiques</DialogTitle>
          <DialogDescription>
            Sélectionnez les graphiques à afficher sur votre dashboard.
            {isMaxReached && (
              <span className="text-amber-600 font-medium ml-1">
                Maximum {maxCharts} graphiques atteint.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un graphique..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Onglets par catégorie */}
        <Tabs
          value={activeCategory}
          onValueChange={v => setActiveCategory(v as 'all' | KPICategory)}
        >
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="sales">{CATEGORY_LABELS.sales}</TabsTrigger>
            <TabsTrigger value="stock">{CATEGORY_LABELS.stock}</TabsTrigger>
            <TabsTrigger value="finance">{CATEGORY_LABELS.finance}</TabsTrigger>
            <TabsTrigger value="linkme">{CATEGORY_LABELS.linkme}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredCharts.map(chart => (
                  <ChartOption
                    key={chart.id}
                    chart={chart}
                    isSelected={selectedCharts.includes(chart.id)}
                    isDisabled={
                      isMaxReached && !selectedCharts.includes(chart.id)
                    }
                    onToggle={() => toggleChart(chart.id)}
                  />
                ))}
              </div>

              {filteredCharts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun graphique trouvé
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedCharts.length} / {maxCharts} graphiques sélectionnés
            </p>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChartOptionProps {
  chart: ChartDefinition;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

function ChartOption({
  chart,
  isSelected,
  isDisabled,
  onToggle,
}: ChartOptionProps) {
  const Icon = chart.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      className={`
        flex items-start gap-3 p-3 rounded-lg border text-left transition-colors
        ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }
        ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
        p-2 rounded-md shrink-0
        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
      `}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{chart.label}</p>
          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {chart.description}
        </p>
        <Badge variant="outline" className="mt-1 text-xs">
          {CHART_TYPE_LABELS[chart.type]}
        </Badge>
      </div>
    </button>
  );
}
