'use client';

/**
 * Modal de sélection de widgets pour le dashboard
 * Permet d'ajouter/retirer des widgets de l'onglet actif
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
} from '@verone/ui';
import { Check, Search } from 'lucide-react';

import { CATEGORY_LABELS, type KPICategory } from '../../lib/kpi-catalog';
import {
  WIDGET_CATALOG,
  type WidgetDefinition,
} from '../../lib/widget-catalog';

interface WidgetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWidgets: string[];
  onWidgetsChange: (widgets: string[]) => void;
  maxWidgets?: number;
}

export function WidgetSelectorModal({
  open,
  onOpenChange,
  selectedWidgets,
  onWidgetsChange,
  maxWidgets = 6,
}: WidgetSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | KPICategory>(
    'all'
  );

  // Filtrer les widgets par recherche et catégorie
  const filteredWidgets = useMemo(() => {
    return Object.values(WIDGET_CATALOG).filter(widget => {
      const matchesSearch =
        search === '' ||
        widget.label.toLowerCase().includes(search.toLowerCase()) ||
        widget.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === 'all' || widget.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  // Toggle un widget
  const toggleWidget = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      onWidgetsChange(selectedWidgets.filter(id => id !== widgetId));
    } else if (selectedWidgets.length < maxWidgets) {
      onWidgetsChange([...selectedWidgets, widgetId]);
    }
  };

  const isMaxReached = selectedWidgets.length >= maxWidgets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des widgets</DialogTitle>
          <DialogDescription>
            Sélectionnez les widgets à afficher sur votre dashboard.
            {isMaxReached && (
              <span className="text-amber-600 font-medium ml-1">
                Maximum {maxWidgets} widgets atteint.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un widget..."
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
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="sales">{CATEGORY_LABELS.sales}</TabsTrigger>
            <TabsTrigger value="stock">{CATEGORY_LABELS.stock}</TabsTrigger>
            <TabsTrigger value="finance">{CATEGORY_LABELS.finance}</TabsTrigger>
            <TabsTrigger value="linkme">{CATEGORY_LABELS.linkme}</TabsTrigger>
            <TabsTrigger value="general">{CATEGORY_LABELS.general}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredWidgets.map(widget => (
                  <WidgetOption
                    key={widget.id}
                    widget={widget}
                    isSelected={selectedWidgets.includes(widget.id)}
                    isDisabled={
                      isMaxReached && !selectedWidgets.includes(widget.id)
                    }
                    onToggle={() => toggleWidget(widget.id)}
                  />
                ))}
              </div>

              {filteredWidgets.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun widget trouvé
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedWidgets.length} / {maxWidgets} widgets sélectionnés
            </p>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WidgetOptionProps {
  widget: WidgetDefinition;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

function WidgetOption({
  widget,
  isSelected,
  isDisabled,
  onToggle,
}: WidgetOptionProps) {
  const Icon = widget.icon;

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
          <p className="text-sm font-medium truncate">{widget.label}</p>
          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {widget.description}
        </p>
      </div>
    </button>
  );
}
