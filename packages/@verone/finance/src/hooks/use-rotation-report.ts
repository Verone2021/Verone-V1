import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// =============================================
// ROTATION REPORT — Turnover & classification FSN
// Calcule la vitesse de rotation des stocks sur une période donnée :
// turnover annuel = ventes_période × (365 / nb_jours_période) / stock_moyen
// FSN : Fast (>6/an) / Slow (1-6) / Non-moving (<1)
// =============================================

export interface ProductRotation {
  id: string;
  name: string;
  sku: string;
  stock_real: number;
  cost_price: number;
  units_sold_period: number;
  cogs_period: number; // Cost of goods sold sur la période (units_sold × cost_price)
  turnover_ratio_annual: number; // Combien de fois le stock tourne en une année
  days_of_stock: number; // 365 / turnover_ratio (Infinity si jamais tourné)
  fsn_class: 'F' | 'S' | 'N'; // Fast, Slow, Non-moving
  immobilized_value: number; // stock_real × cost_price (seul utile si Non-moving)
}

export interface RotationReportData {
  summary: {
    period_days: number;
    period_from: string;
    period_to: string;
    total_products_analyzed: number;
    total_cogs_period: number;
    average_turnover_ratio: number;
    fast_count: number;
    slow_count: number;
    non_moving_count: number;
    immobilized_in_non_moving: number;
  };
  fast_movers: ProductRotation[]; // Top 20 plus rapides
  non_movers: ProductRotation[]; // Top 20 dormants par valeur immobilisée
  by_class: Array<{
    class: 'F' | 'S' | 'N';
    label: string;
    count: number;
    units_sold: number;
    cogs: number;
    immobilized: number;
  }>;
  generated_at: string;
}

interface UseRotationReportParams {
  dateFrom: string;
  dateTo: string;
}

const FAST_THRESHOLD = 6; // > 6 rotations / an = Fast
const SLOW_THRESHOLD = 1; // 1-6 = Slow ; < 1 = Non-moving

export function useRotationReport({
  dateFrom,
  dateTo,
}: UseRotationReportParams) {
  const [report, setReport] = useState<RotationReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const periodFromIso = new Date(dateFrom).toISOString();
      const periodToIso = new Date(`${dateTo}T23:59:59.999Z`).toISOString();
      const periodMs =
        new Date(periodToIso).getTime() - new Date(periodFromIso).getTime();
      const periodDays = Math.max(
        1,
        Math.round(periodMs / (1000 * 60 * 60 * 24))
      );

      // 1) Tous les produits non archivés
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_real, cost_price')
        .is('archived_at', null);

      if (productsError) throw productsError;

      // 2) Mouvements OUT sur la période (= ventes/sorties)
      const { data: movements, error: mvtError } = await supabase
        .from('stock_movements')
        .select('product_id, movement_type, quantity_change')
        .eq('movement_type', 'OUT')
        .gte('performed_at', periodFromIso)
        .lte('performed_at', periodToIso);

      if (mvtError) throw mvtError;

      // Agréger les unités vendues par produit (quantity_change est négatif pour OUT)
      const soldPerProduct = new Map<string, number>();
      (movements ?? []).forEach(m => {
        const current = soldPerProduct.get(m.product_id) ?? 0;
        soldPerProduct.set(
          m.product_id,
          current + Math.abs(m.quantity_change ?? 0)
        );
      });

      // 3) Calcul turnover par produit
      const annualizationFactor = 365 / periodDays;

      const productsRotation: ProductRotation[] = products.map(p => {
        const stockReal = p.stock_real ?? 0;
        const costPrice = Number(p.cost_price) || 0;
        const unitsSold = soldPerProduct.get(p.id) ?? 0;
        const cogsPeriod = unitsSold * costPrice;
        const immobilizedValue = stockReal * costPrice;

        // Stock moyen approximé = stock_actuel + (unitsSold / 2)
        // (idéalement reconstitué historiquement, mais approximation suffisante
        // pour la classification FSN — Roméo veut surtout savoir ce qui dort)
        const avgStock = Math.max(1, stockReal + unitsSold / 2);
        const turnoverPeriod = unitsSold / avgStock;
        const turnoverAnnual = turnoverPeriod * annualizationFactor;
        const daysOfStock =
          turnoverAnnual > 0 ? 365 / turnoverAnnual : Infinity;

        let fsnClass: 'F' | 'S' | 'N';
        if (turnoverAnnual >= FAST_THRESHOLD) fsnClass = 'F';
        else if (turnoverAnnual >= SLOW_THRESHOLD) fsnClass = 'S';
        else fsnClass = 'N';

        return {
          id: p.id,
          name: p.name || 'Sans nom',
          sku: p.sku || '',
          stock_real: stockReal,
          cost_price: costPrice,
          units_sold_period: unitsSold,
          cogs_period: cogsPeriod,
          turnover_ratio_annual: turnoverAnnual,
          days_of_stock: daysOfStock,
          fsn_class: fsnClass,
          immobilized_value: immobilizedValue,
        };
      });

      // KPIs globaux
      const totalCogs = productsRotation.reduce(
        (sum, p) => sum + p.cogs_period,
        0
      );
      const productsWithMovement = productsRotation.filter(
        p => p.units_sold_period > 0
      );
      const avgTurnover =
        productsWithMovement.length > 0
          ? productsWithMovement.reduce(
              (sum, p) => sum + p.turnover_ratio_annual,
              0
            ) / productsWithMovement.length
          : 0;

      const fastList = productsRotation.filter(p => p.fsn_class === 'F');
      const slowList = productsRotation.filter(p => p.fsn_class === 'S');
      const nonMovingList = productsRotation.filter(p => p.fsn_class === 'N');

      const immobilizedInNonMoving = nonMovingList
        .filter(p => p.stock_real > 0)
        .reduce((sum, p) => sum + p.immobilized_value, 0);

      // Top 20 Fast (plus haute rotation)
      const topFast = [...productsRotation]
        .filter(p => p.fsn_class === 'F')
        .sort((a, b) => b.turnover_ratio_annual - a.turnover_ratio_annual)
        .slice(0, 20);

      // Top 20 Non-moving (plus de valeur immobilisée qui ne tourne pas)
      const topNonMovers = [...nonMovingList]
        .filter(p => p.stock_real > 0)
        .sort((a, b) => b.immobilized_value - a.immobilized_value)
        .slice(0, 20);

      const reportData: RotationReportData = {
        summary: {
          period_days: periodDays,
          period_from: dateFrom,
          period_to: dateTo,
          total_products_analyzed: productsRotation.length,
          total_cogs_period: totalCogs,
          average_turnover_ratio: avgTurnover,
          fast_count: fastList.length,
          slow_count: slowList.length,
          non_moving_count: nonMovingList.length,
          immobilized_in_non_moving: immobilizedInNonMoving,
        },
        fast_movers: topFast,
        non_movers: topNonMovers,
        by_class: [
          {
            class: 'F',
            label: 'Fast (rotation > 6/an)',
            count: fastList.length,
            units_sold: fastList.reduce((s, p) => s + p.units_sold_period, 0),
            cogs: fastList.reduce((s, p) => s + p.cogs_period, 0),
            immobilized: fastList.reduce((s, p) => s + p.immobilized_value, 0),
          },
          {
            class: 'S',
            label: 'Slow (1 à 6/an)',
            count: slowList.length,
            units_sold: slowList.reduce((s, p) => s + p.units_sold_period, 0),
            cogs: slowList.reduce((s, p) => s + p.cogs_period, 0),
            immobilized: slowList.reduce((s, p) => s + p.immobilized_value, 0),
          },
          {
            class: 'N',
            label: 'Non-moving (< 1/an)',
            count: nonMovingList.length,
            units_sold: nonMovingList.reduce(
              (s, p) => s + p.units_sold_period,
              0
            ),
            cogs: nonMovingList.reduce((s, p) => s + p.cogs_period, 0),
            immobilized: immobilizedInNonMoving,
          },
        ],
        generated_at: new Date().toISOString(),
      };

      setReport(reportData);
      return reportData;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du rapport rotation';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, toast, dateFrom, dateTo]);

  return {
    report,
    loading,
    error,
    generateReport,
  };
}
