import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// =============================================
// PERFORMANCE FOURNISSEURS — Délai, conformité, qualité par fournisseur
// Classification : excellent / good / warning / critical / insufficient_data
// Quality Index = 0.5 × conformité + 0.5 × (100 − manquant)
// =============================================

export type SupplierLevel =
  | 'excellent'
  | 'good'
  | 'warning'
  | 'critical'
  | 'insufficient_data';

export interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  supplier_segment: string | null;
  preferred_supplier: boolean;
  po_count: number;
  po_received_count: number;
  po_sample_count: number;
  total_spent_ttc: number;
  avg_delay_days: number | null;
  conformity_rate: number;
  missing_qty_rate: number;
  quality_index: number;
  level: SupplierLevel;
}

export interface FournisseursReportData {
  summary: {
    period_days: number;
    period_from: string;
    period_to: string;
    total_suppliers: number;
    total_po: number;
    total_spent_ttc: number;
    avg_delay_global: number | null;
    avg_conformity_global: number;
    excellent_count: number;
    good_count: number;
    warning_count: number;
    critical_count: number;
    insufficient_count: number;
  };
  excellent: SupplierPerformance[];
  good: SupplierPerformance[];
  warning: SupplierPerformance[];
  critical: SupplierPerformance[];
  insufficient_data: SupplierPerformance[];
  generated_at: string;
}

interface UseFournisseursReportParams {
  dateFrom: string;
  dateTo: string;
}

const MIN_PO_FOR_SCORING = 2;
const MIN_PO_FOR_EXCELLENT = 3;
const EXCELLENT_THRESHOLD = 85;
const GOOD_THRESHOLD = 65;
const WARNING_THRESHOLD = 40;
const CRITICAL_DELAY_DAYS = 30;

interface PoRow {
  id: string;
  supplier_id: string;
  status: string;
  validated_at: string | null;
  received_at: string | null;
  expected_delivery_date: string | null;
  total_ttc: number | null;
  po_type: string;
}

interface PoItemRow {
  purchase_order_id: string;
  quantity: number | null;
  quantity_received: number | null;
}

interface SupplierRow {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  supplier_segment: string | null;
  preferred_supplier: boolean | null;
}

interface SupplierAggregate {
  po_count: number;
  po_received_count: number;
  po_sample_count: number;
  total_spent_ttc: number;
  delay_days_sum: number;
  delay_days_count: number;
  conformity_eligible: number;
  conformity_hits: number;
  qty_ordered: number;
  qty_received: number;
}

export function useFournisseursReport({
  dateFrom,
  dateTo,
}: UseFournisseursReportParams) {
  const [report, setReport] = useState<FournisseursReportData | null>(null);
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

      const { data: posData, error: posError } = await supabase
        .from('purchase_orders')
        .select(
          'id, supplier_id, status, validated_at, received_at, expected_delivery_date, total_ttc, po_type'
        )
        .gte('created_at', periodFromIso)
        .lte('created_at', periodToIso)
        .neq('status', 'cancelled');

      if (posError) throw posError;
      const pos = (posData ?? []) as PoRow[];

      if (pos.length === 0) {
        const empty: FournisseursReportData = {
          summary: {
            period_days: periodDays,
            period_from: dateFrom,
            period_to: dateTo,
            total_suppliers: 0,
            total_po: 0,
            total_spent_ttc: 0,
            avg_delay_global: null,
            avg_conformity_global: 0,
            excellent_count: 0,
            good_count: 0,
            warning_count: 0,
            critical_count: 0,
            insufficient_count: 0,
          },
          excellent: [],
          good: [],
          warning: [],
          critical: [],
          insufficient_data: [],
          generated_at: new Date().toISOString(),
        };
        setReport(empty);
        return empty;
      }

      const poIds = pos.map(po => po.id);
      const supplierIds = Array.from(new Set(pos.map(po => po.supplier_id)));

      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('purchase_order_id, quantity, quantity_received')
        .in('purchase_order_id', poIds);

      if (itemsError) throw itemsError;
      const items = (itemsData ?? []) as PoItemRow[];

      const { data: suppliersData, error: suppliersError } = await supabase
        .from('organisations')
        .select(
          'id, legal_name, trade_name, supplier_segment, preferred_supplier'
        )
        .in('id', supplierIds);

      if (suppliersError) throw suppliersError;
      const suppliers = (suppliersData ?? []) as SupplierRow[];

      const supplierIndex = new Map<string, SupplierRow>();
      suppliers.forEach(s => supplierIndex.set(s.id, s));

      const itemsByPo = new Map<string, PoItemRow[]>();
      items.forEach(item => {
        const list = itemsByPo.get(item.purchase_order_id) ?? [];
        list.push(item);
        itemsByPo.set(item.purchase_order_id, list);
      });

      const aggregates = new Map<string, SupplierAggregate>();

      pos.forEach(po => {
        const agg = aggregates.get(po.supplier_id) ?? {
          po_count: 0,
          po_received_count: 0,
          po_sample_count: 0,
          total_spent_ttc: 0,
          delay_days_sum: 0,
          delay_days_count: 0,
          conformity_eligible: 0,
          conformity_hits: 0,
          qty_ordered: 0,
          qty_received: 0,
        };

        agg.po_count += 1;
        if (po.po_type === 'sample') agg.po_sample_count += 1;
        if (po.status === 'received') agg.po_received_count += 1;

        if (po.status === 'received' || po.status === 'validated') {
          agg.total_spent_ttc += Number(po.total_ttc) || 0;
        }

        if (po.status === 'received' && po.validated_at && po.received_at) {
          const delayMs =
            new Date(po.received_at).getTime() -
            new Date(po.validated_at).getTime();
          if (delayMs >= 0) {
            agg.delay_days_sum += delayMs / (1000 * 60 * 60 * 24);
            agg.delay_days_count += 1;
          }
        }

        if (
          po.status === 'received' &&
          po.received_at &&
          po.expected_delivery_date
        ) {
          agg.conformity_eligible += 1;
          const receivedDay = new Date(po.received_at)
            .toISOString()
            .slice(0, 10);
          if (receivedDay <= po.expected_delivery_date) {
            agg.conformity_hits += 1;
          }
        }

        const poItems = itemsByPo.get(po.id) ?? [];
        poItems.forEach(item => {
          const ordered = Number(item.quantity) || 0;
          const received = Number(item.quantity_received) || 0;
          agg.qty_ordered += ordered;
          agg.qty_received += Math.min(received, ordered);
        });

        aggregates.set(po.supplier_id, agg);
      });

      const performances: SupplierPerformance[] = Array.from(
        aggregates.entries()
      ).map(([supplierId, agg]) => {
        const supplier = supplierIndex.get(supplierId);
        const tradeName = supplier?.trade_name?.trim() ?? '';
        const legalName = supplier?.legal_name?.trim() ?? '';
        const name =
          tradeName.length > 0
            ? tradeName
            : legalName.length > 0
              ? legalName
              : 'Fournisseur sans nom';

        const avgDelay =
          agg.delay_days_count > 0
            ? agg.delay_days_sum / agg.delay_days_count
            : null;

        const conformity =
          agg.conformity_eligible > 0
            ? (agg.conformity_hits / agg.conformity_eligible) * 100
            : 100;

        const missing =
          agg.qty_ordered > 0
            ? Math.max(
                0,
                ((agg.qty_ordered - agg.qty_received) / agg.qty_ordered) * 100
              )
            : 0;

        const qualityIndex = 0.5 * conformity + 0.5 * (100 - missing);

        let level: SupplierLevel;
        if (agg.po_received_count < MIN_PO_FOR_SCORING) {
          level = 'insufficient_data';
        } else if (
          qualityIndex < WARNING_THRESHOLD ||
          (avgDelay !== null && avgDelay > CRITICAL_DELAY_DAYS)
        ) {
          level = 'critical';
        } else if (qualityIndex < GOOD_THRESHOLD) {
          level = 'warning';
        } else if (qualityIndex < EXCELLENT_THRESHOLD) {
          level = 'good';
        } else if (agg.po_count >= MIN_PO_FOR_EXCELLENT) {
          level = 'excellent';
        } else {
          level = 'good';
        }

        return {
          supplier_id: supplierId,
          supplier_name: name,
          supplier_segment: supplier?.supplier_segment ?? null,
          preferred_supplier: supplier?.preferred_supplier ?? false,
          po_count: agg.po_count,
          po_received_count: agg.po_received_count,
          po_sample_count: agg.po_sample_count,
          total_spent_ttc: agg.total_spent_ttc,
          avg_delay_days: avgDelay,
          conformity_rate: conformity,
          missing_qty_rate: missing,
          quality_index: qualityIndex,
          level,
        };
      });

      const byLevel = (lvl: SupplierLevel) =>
        performances
          .filter(p => p.level === lvl)
          .sort((a, b) => {
            if (lvl === 'critical' || lvl === 'warning') {
              return a.quality_index - b.quality_index;
            }
            if (lvl === 'insufficient_data') {
              return b.po_count - a.po_count;
            }
            return b.quality_index - a.quality_index;
          });

      const excellent = byLevel('excellent');
      const good = byLevel('good');
      const warning = byLevel('warning');
      const critical = byLevel('critical');
      const insufficient = byLevel('insufficient_data');

      const scored = [...excellent, ...good, ...warning, ...critical];
      const avgDelayGlobal = (() => {
        const withDelay = scored.filter(
          (p): p is SupplierPerformance & { avg_delay_days: number } =>
            p.avg_delay_days !== null
        );
        if (withDelay.length === 0) return null;
        const sum = withDelay.reduce((s, p) => s + p.avg_delay_days, 0);
        return sum / withDelay.length;
      })();

      const avgConformityGlobal =
        scored.length > 0
          ? scored.reduce((s, p) => s + p.conformity_rate, 0) / scored.length
          : 0;

      const totalSpent = performances.reduce(
        (s, p) => s + p.total_spent_ttc,
        0
      );

      const reportData: FournisseursReportData = {
        summary: {
          period_days: periodDays,
          period_from: dateFrom,
          period_to: dateTo,
          total_suppliers: performances.length,
          total_po: pos.length,
          total_spent_ttc: totalSpent,
          avg_delay_global: avgDelayGlobal,
          avg_conformity_global: avgConformityGlobal,
          excellent_count: excellent.length,
          good_count: good.length,
          warning_count: warning.length,
          critical_count: critical.length,
          insufficient_count: insufficient.length,
        },
        excellent,
        good,
        warning,
        critical,
        insufficient_data: insufficient,
        generated_at: new Date().toISOString(),
      };

      setReport(reportData);
      return reportData;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération du rapport fournisseurs';
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

  return { report, loading, error, generateReport };
}
