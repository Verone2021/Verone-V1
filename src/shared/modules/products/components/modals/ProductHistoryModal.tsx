/**
 * 🆕 Phase 3.5.1: Extraction ProductHistoryModal
 * ✅ Phase 3.6: Ajout filtres date + type + statistiques
 *
 * Composant modal affichant l'historique complet des mouvements d'un produit
 * Réutilisable par /stocks/inventaire, /produits/catalogue/[id], etc.
 *
 * @since Phase 3.5.1 - 2025-11-01
 * @updated Phase 3.6 - 2025-11-03 - Filtres date + type + stats
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';

import {
  Package,
  RefreshCw,
  History,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useStockMovements } from '@/shared/modules/stock/hooks';

interface ProductHistoryModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryFilters {
  dateRange: 'all' | 'today' | '7days' | '30days';
  movementTypes: string[];
}

export function ProductHistoryModal({
  product,
  isOpen,
  onClose,
}: ProductHistoryModalProps) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: 'all',
    movementTypes: [],
  });
  const { getProductHistory, getReasonDescription } = useStockMovements();

  useEffect(() => {
    if (isOpen && product) {
      loadHistory();
    }
  }, [isOpen, product]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await getProductHistory(product.id);
      setMovements(history as any);
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  // ✅ Phase 3.6: Filtrer mouvements selon critères
  const filteredMovements = useMemo(() => {
    let filtered = [...movements];

    // Filtre par période
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(
        (m: any) => new Date(m.performed_at) >= startDate
      );
    }

    // Filtre par type de mouvement
    if (filters.movementTypes.length > 0) {
      filtered = filtered.filter((m: any) =>
        filters.movementTypes.includes(m.movement_type)
      );
    }

    return filtered;
  }, [movements, filters]);

  // ✅ Phase 3.6: Statistiques filtrées
  const stats = useMemo(() => {
    const totalIn = filteredMovements
      .filter((m: any) => m.movement_type === 'IN')
      .reduce((sum, m: any) => sum + m.quantity_change, 0);

    const totalOut = filteredMovements
      .filter((m: any) => m.movement_type === 'OUT')
      .reduce((sum, m: any) => sum + Math.abs(m.quantity_change), 0);

    const totalAdjust = filteredMovements
      .filter((m: any) => m.movement_type === 'ADJUST')
      .reduce((sum, m: any) => sum + m.quantity_change, 0);

    return {
      total: filteredMovements.length,
      totalIn,
      totalOut,
      totalAdjust,
      netChange: totalIn - totalOut + totalAdjust,
    };
  }, [filteredMovements]);

  // Toggle type de mouvement
  const toggleMovementType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      movementTypes: prev.movementTypes.includes(type)
        ? prev.movementTypes.filter(t => t !== type)
        : [...prev.movementTypes, type],
    }));
  };

  // Reset filtres
  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      movementTypes: [],
    });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters =
    filters.dateRange !== 'all' || filters.movementTypes.length > 0;

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      ADJUST: 'Ajustement',
      TRANSFER: 'Transfert',
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-black text-white',
      OUT: 'bg-gray-700 text-white',
      ADJUST: 'bg-gray-500 text-white',
      TRANSFER: 'bg-gray-400 text-white',
    };
    return colors[type] || 'bg-gray-300 text-black';
  };

  const getSourceInfo = (movement: any) => {
    // Si c'est lié à une commande
    if (movement.reference_type === 'order' && movement.reference_id) {
      return {
        type: 'order',
        label: 'Commande',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id,
      };
    }

    // Si c'est lié à une vente
    if (movement.reference_type === 'sale' && movement.reference_id) {
      return {
        type: 'sale',
        label: 'Vente',
        link: `/commandes/${movement.reference_id}`,
        reference: movement.reference_id,
      };
    }

    // Mouvement manuel
    return {
      type: 'manual',
      label: 'Manuel',
      link: null,
      reference: null,
    };
  };

  const getPerformerName = (movement: any) => {
    if (movement.user_profiles) {
      const { first_name, last_name } = movement.user_profiles;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
    }
    return 'Admin';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-xl font-bold text-black flex items-center gap-3">
            <History className="h-5 w-5" />
            Historique complet - {product?.name}
            <Badge variant="outline" className="ml-2 text-xs font-mono">
              {product?.sku}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualisez tous les mouvements de stock pour ce produit
          </DialogDescription>
        </DialogHeader>

        {/* ✅ Phase 3.6: Statistiques filtrées */}
        {movements.length > 0 && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <BarChart3 className="h-3 w-3" />
                Total Mouvements
              </div>
              <div className="text-2xl font-bold text-black">{stats.total}</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <TrendingUp className="h-3 w-3" />
                Entrées
              </div>
              <div className="text-2xl font-bold text-black">
                +{stats.totalIn}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <TrendingDown className="h-3 w-3" />
                Sorties
              </div>
              <div className="text-2xl font-bold text-gray-700">
                -{stats.totalOut}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <Package className="h-3 w-3" />
                Variation Nette
              </div>
              <div
                className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-black' : 'text-red-600'}`}
              >
                {stats.netChange >= 0 ? '+' : ''}
                {stats.netChange}
              </div>
            </div>
          </div>
        )}

        {/* ✅ Phase 3.6: Filtres date + type */}
        {movements.length > 0 && (
          <div className="p-4 space-y-4 border-b border-gray-200 bg-white">
            {/* Filtres de période */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Période
              </Label>
              <div className="flex flex-wrap gap-2">
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, dateRange: 'all' }))
                  }
                  className={`h-8 text-xs ${filters.dateRange === 'all' ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300'}`}
                >
                  Tout afficher
                </ButtonV2>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, dateRange: 'today' }))
                  }
                  className={`h-8 text-xs ${filters.dateRange === 'today' ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300'}`}
                >
                  Aujourd'hui
                </ButtonV2>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, dateRange: '7days' }))
                  }
                  className={`h-8 text-xs ${filters.dateRange === '7days' ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300'}`}
                >
                  7 derniers jours
                </ButtonV2>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, dateRange: '30days' }))
                  }
                  className={`h-8 text-xs ${filters.dateRange === '30days' ? 'bg-black text-white hover:bg-gray-800' : 'border-gray-300'}`}
                >
                  30 derniers jours
                </ButtonV2>
                {hasActiveFilters && (
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-3 w-3 mr-1.5" />
                    Reset
                  </ButtonV2>
                )}
              </div>
            </div>

            {/* Filtres de type de mouvement */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Types de mouvement
                {filters.movementTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filters.movementTypes.length} sélectionné
                    {filters.movementTypes.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'IN', label: 'Entrées', icon: TrendingUp },
                  { value: 'OUT', label: 'Sorties', icon: TrendingDown },
                  { value: 'ADJUST', label: 'Ajustements', icon: Package },
                  { value: 'TRANSFER', label: 'Transferts', icon: Package },
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`modal-type-${type.value}`}
                        checked={filters.movementTypes.includes(type.value)}
                        onCheckedChange={() => toggleMovementType(type.value)}
                      />
                      <Label
                        htmlFor={`modal-type-${type.value}`}
                        className="text-xs cursor-pointer flex items-center gap-1.5 font-normal"
                      >
                        <Icon className="h-3 w-3" />
                        {type.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          className="overflow-y-auto pr-2"
          style={{ maxHeight: 'calc(85vh - 350px)' }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Aucun mouvement trouvé
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Ce produit n'a pas encore d'historique de mouvements
              </p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Aucun mouvement pour ces filtres
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Modifiez les critères ou réinitialisez les filtres
              </p>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Réinitialiser les filtres
              </ButtonV2>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header table */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-700 sticky top-0">
                <div className="col-span-2">Date & Heure</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1 text-right">Quantité</div>
                <div className="col-span-2 text-center">Stock</div>
                <div className="col-span-2">Motif / Notes</div>
                <div className="col-span-2">Par</div>
                <div className="col-span-2">Source</div>
              </div>

              {/* Timeline entries */}
              <div className="relative">
                {/* Ligne verticale timeline */}
                <div className="absolute left-[16.666%] top-0 bottom-0 w-px bg-gray-200" />

                {filteredMovements.map((movement: any, index: number) => {
                  const sourceInfo = getSourceInfo(movement);
                  const performerName = getPerformerName(movement);
                  const reasonLabel = movement.reason_code
                    ? getReasonDescription(movement.reason_code)
                    : '-';

                  return (
                    <div
                      key={movement.id}
                      className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm relative"
                    >
                      {/* Date & Heure */}
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-black font-medium">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {new Date(movement.performed_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs ml-4">
                          <Clock className="h-3 w-3" />
                          {new Date(movement.performed_at).toLocaleTimeString(
                            'fr-FR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-1 flex items-center relative z-10">
                        {/* Dot sur la timeline */}
                        <div className="absolute left-[-8.333%] w-2 h-2 rounded-full bg-black border-2 border-white" />
                        <Badge
                          className={`text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}
                        >
                          {getMovementTypeLabel(movement.movement_type)}
                        </Badge>
                      </div>

                      {/* Quantité */}
                      <div className="col-span-1 flex items-center justify-end">
                        <span
                          className={`font-bold text-base ${
                            movement.quantity_change > 0
                              ? 'text-black'
                              : 'text-gray-700'
                          }`}
                        >
                          {movement.quantity_change > 0 ? '+' : ''}
                          {movement.quantity_change}
                        </span>
                      </div>

                      {/* Stock (avant → après) */}
                      <div className="col-span-2 flex items-center justify-center gap-2 font-mono text-sm">
                        <span className="text-gray-500">
                          {movement.quantity_before}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-black font-bold">
                          {movement.quantity_after}
                        </span>
                      </div>

                      {/* Motif / Notes */}
                      <div className="col-span-2 flex flex-col gap-1">
                        {movement.reason_code && (
                          <span className="text-gray-900 text-xs font-medium">
                            {reasonLabel}
                          </span>
                        )}
                        {movement.notes && (
                          <span className="text-gray-600 text-xs line-clamp-2">
                            {movement.notes}
                          </span>
                        )}
                        {!movement.reason_code && !movement.notes && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>

                      {/* Par (Performer) */}
                      <div className="col-span-2 flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-900 text-xs font-medium truncate">
                          {performerName}
                        </span>
                      </div>

                      {/* Source */}
                      <div className="col-span-2 flex items-center gap-2">
                        {sourceInfo.type === 'manual' ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-300 text-gray-600"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {sourceInfo.label}
                          </Badge>
                        ) : (
                          <Link
                            href={sourceInfo.link || '#'}
                            className="flex items-center gap-1.5 text-black hover:text-gray-700 transition-colors group"
                            onClick={e => e.stopPropagation()}
                          >
                            <Badge className="bg-black text-white text-xs group-hover:bg-gray-700 transition-colors">
                              {sourceInfo.label}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-black" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer stats - ✅ Phase 3.6: Afficher stats filtrées */}
        {movements.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-black">
                  {hasActiveFilters && `${stats.total} / `}
                  {movements.length} mouvement{movements.length > 1 ? 's' : ''}
                  {hasActiveFilters && ' total'}
                </span>
                <span>
                  Stock actuel:{' '}
                  <strong className="text-black">
                    {product?.stock_quantity || 0}
                  </strong>
                </span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtres actifs
                  </Badge>
                )}
              </div>
              <span className="text-gray-500">
                Dernier mouvement:{' '}
                {movements[0]
                  ? new Date(
                      (movements[0] as any).performed_at
                    ).toLocaleDateString('fr-FR')
                  : 'Aucun'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
