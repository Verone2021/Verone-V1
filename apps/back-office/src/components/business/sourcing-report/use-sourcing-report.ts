'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

export interface SourcingReportStatusCount {
  status: string;
  label: string;
  count: number;
}

export interface SourcingReportSupplierAggregate {
  supplier_id: string;
  supplier_name: string;
  products_count: number;
  avg_quoted_price: number | null;
}

export interface SourcingReportTopNegotiation {
  product_id: string;
  product_name: string;
  cost_price: number | null;
  target_price: number | null;
  delta: number | null;
}

export interface SourcingReportData {
  summary: {
    total_products: number;
    total_with_supplier: number;
    avg_target_price: number;
    avg_cost_price: number;
    generated_at: string;
  };
  status_distribution: SourcingReportStatusCount[];
  top_suppliers: SourcingReportSupplierAggregate[];
  top_negotiations: SourcingReportTopNegotiation[];
}

const STATUS_LABELS: Record<string, string> = {
  need_identified: 'Besoin identifié',
  supplier_search: 'Recherche fournisseur',
  initial_contact: 'Contact initial',
  evaluation: 'Évaluation',
  negotiation: 'Négociation',
  sample_requested: 'Échantillon demandé',
  sample_received: 'Échantillon reçu',
  sample_approved: 'Échantillon validé',
  sample_rejected: 'Échantillon refusé',
  order_placed: 'Commande passée',
  received: 'Reçu',
  on_hold: 'En pause',
  cancelled: 'Annulé',
};

export function useSourcingReport() {
  const [report, setReport] = useState<SourcingReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(
          'id, name, sourcing_status, supplier_id, cost_price, target_price, supplier:organisations!products_supplier_id_fkey(id, trade_name, legal_name)'
        )
        .eq('creation_mode', 'sourcing')
        .is('archived_at', null);

      if (productsError) throw productsError;
      const rows = products ?? [];

      // Métriques globales
      const withSupplier = rows.filter(r => r.supplier_id).length;
      const targets = rows
        .map(r => r.target_price)
        .filter((v): v is number => typeof v === 'number' && v > 0);
      const costs = rows
        .map(r => r.cost_price)
        .filter((v): v is number => typeof v === 'number' && v > 0);
      const avgTarget = targets.length
        ? targets.reduce((s, v) => s + v, 0) / targets.length
        : 0;
      const avgCost = costs.length
        ? costs.reduce((s, v) => s + v, 0) / costs.length
        : 0;

      // Distribution par statut
      const statusCount = new Map<string, number>();
      for (const r of rows) {
        const s = r.sourcing_status ?? 'need_identified';
        statusCount.set(s, (statusCount.get(s) ?? 0) + 1);
      }
      const status_distribution: SourcingReportStatusCount[] = Array.from(
        statusCount.entries()
      )
        .map(([status, count]) => ({
          status,
          label: STATUS_LABELS[status] ?? status,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // Top fournisseurs
      const supplierMap = new Map<
        string,
        { name: string; quotes: number[]; count: number }
      >();
      for (const r of rows) {
        if (!r.supplier_id) continue;
        const name =
          r.supplier?.trade_name ?? r.supplier?.legal_name ?? 'Fournisseur';
        const entry = supplierMap.get(r.supplier_id) ?? {
          name,
          quotes: [],
          count: 0,
        };
        entry.count += 1;
        if (typeof r.cost_price === 'number' && r.cost_price > 0) {
          entry.quotes.push(r.cost_price);
        }
        supplierMap.set(r.supplier_id, entry);
      }
      const top_suppliers: SourcingReportSupplierAggregate[] = Array.from(
        supplierMap.entries()
      )
        .map(([supplier_id, info]) => ({
          supplier_id,
          supplier_name: info.name,
          products_count: info.count,
          avg_quoted_price: info.quotes.length
            ? info.quotes.reduce((s, v) => s + v, 0) / info.quotes.length
            : null,
        }))
        .sort((a, b) => b.products_count - a.products_count)
        .slice(0, 10);

      // Top négociations (cost < target = bonne marge)
      const top_negotiations: SourcingReportTopNegotiation[] = rows
        .filter(
          r =>
            typeof r.cost_price === 'number' &&
            typeof r.target_price === 'number' &&
            r.cost_price > 0 &&
            r.target_price > 0
        )
        .map(r => ({
          product_id: r.id,
          product_name: r.name,
          cost_price: r.cost_price,
          target_price: r.target_price,
          delta:
            r.target_price! > 0
              ? ((r.target_price! - (r.cost_price ?? 0)) / r.target_price!) *
                100
              : null,
        }))
        .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
        .slice(0, 10);

      setReport({
        summary: {
          total_products: rows.length,
          total_with_supplier: withSupplier,
          avg_target_price: avgTarget,
          avg_cost_price: avgCost,
          generated_at: new Date().toISOString(),
        },
        status_distribution,
        top_suppliers,
        top_negotiations,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport sourcing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  return { report, loading, error, generateReport };
}
