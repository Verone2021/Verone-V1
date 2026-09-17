'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { convertToEur, defaultRateFor } from '@verone/utils/currency';
import { createClient } from '@verone/utils/supabase/client';

import type { SupplierCostInput } from '../lib/consultation-supplier-costs';

// ── Types ────────────────────────────────────────────────────────────

/** Frais saisis pour un fournisseur dans une consultation (montants HT). */
export interface ConsultationSupplierCost {
  id: string;
  consultation_id: string;
  supplier_id: string;
  shipping_cost_ht: number;
  customs_cost_ht: number;
  other_cost_ht: number;
  other_cost_label: string | null;
  /** Monnaie des frais ('EUR' | 'USD'). Défaut 'EUR'. */
  currency: string;
  /**
   * Taux de change → EUR figé au moment de la saisie.
   * Défaut 1 (EUR). [BO-CONSULT-CURRENCY-001]
   */
  exchange_rate: number;
  notes: string | null;
}

export interface UpsertSupplierCostData {
  supplier_id: string;
  shipping_cost_ht: number;
  customs_cost_ht: number;
  other_cost_ht: number;
  other_cost_label?: string | null;
  /** Monnaie des frais. Défaut 'EUR'. */
  currency?: string;
  /** Taux figé → EUR. Défaut = defaultRateFor(currency). */
  exchange_rate?: number;
  notes?: string | null;
}

const supabase = createClient();

/**
 * Frais de port, douane et autres saisis une fois par fournisseur pour une
 * consultation. Répartis sur ses lignes par `allocateSupplierCosts`.
 *
 * La table existait depuis BO-CONSULT-P9-001 sans aucun accès applicatif :
 * ce hook est son premier consommateur (BO-CONSULT-MULTI-001).
 */
export function useConsultationSupplierCosts(consultationId?: string) {
  const [supplierCosts, setSupplierCosts] = useState<
    ConsultationSupplierCost[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSupplierCosts = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('consultation_supplier_costs')
        .select(
          'id, consultation_id, supplier_id, shipping_cost_ht, customs_cost_ht, other_cost_ht, other_cost_label, currency, exchange_rate, notes'
        )
        .eq('consultation_id', id);

      if (queryError) throw queryError;

      setSupplierCosts(
        (data ?? []).map(row => {
          const currency = row.currency ?? 'EUR';
          return {
            id: row.id,
            consultation_id: row.consultation_id,
            supplier_id: row.supplier_id,
            shipping_cost_ht: Number(row.shipping_cost_ht ?? 0),
            customs_cost_ht: Number(row.customs_cost_ht ?? 0),
            other_cost_ht: Number(row.other_cost_ht ?? 0),
            other_cost_label: row.other_cost_label ?? null,
            currency,
            exchange_rate: Number(
              row.exchange_rate ?? defaultRateFor(currency)
            ),
            notes: row.notes ?? null,
          };
        })
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des frais fournisseurs';
      setError(message);
      console.error('[useConsultationSupplierCosts] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Enregistre les frais d'un fournisseur (une seule ligne par fournisseur —
   * contrainte UNIQUE en base). Tous les montants à zéro : la ligne est
   * supprimée plutôt que conservée à vide.
   */
  const upsertSupplierCost = async (
    data: UpsertSupplierCostData
  ): Promise<boolean> => {
    if (!consultationId) return false;
    try {
      setError(null);

      const total =
        data.shipping_cost_ht + data.customs_cost_ht + data.other_cost_ht;

      if (total === 0) {
        const { error: deleteError } = await supabase
          .from('consultation_supplier_costs')
          .delete()
          .eq('consultation_id', consultationId)
          .eq('supplier_id', data.supplier_id);
        if (deleteError) throw deleteError;
      } else {
        const resolvedCurrency = data.currency ?? 'EUR';
        const resolvedRate =
          data.exchange_rate ?? defaultRateFor(resolvedCurrency);

        const { error: upsertError } = await supabase
          .from('consultation_supplier_costs')
          .upsert(
            {
              consultation_id: consultationId,
              supplier_id: data.supplier_id,
              shipping_cost_ht: data.shipping_cost_ht,
              customs_cost_ht: data.customs_cost_ht,
              other_cost_ht: data.other_cost_ht,
              other_cost_label: data.other_cost_label ?? null,
              currency: resolvedCurrency,
              exchange_rate: resolvedRate,
              notes: data.notes ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'consultation_id,supplier_id' }
          );
        if (upsertError) throw upsertError;
      }

      await fetchSupplierCosts(consultationId);
      toast({
        title: 'Frais enregistrés',
        description: 'Les frais du fournisseur ont été mis à jour',
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement des frais";
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  /**
   * Frais au format attendu par le calcul (`settings.supplierCosts`).
   * Les montants sont convertis en euros à l'aide du taux figé sur chaque ligne.
   * Le moteur `consultation-economics.ts` ne manipule que des euros.
   * [BO-CONSULT-CURRENCY-001]
   */
  const supplierCostInputs: SupplierCostInput[] = useMemo(
    () =>
      supplierCosts.map(cost => {
        const toEur = (amount: number): number =>
          convertToEur(amount, cost.currency, cost.exchange_rate);
        return {
          supplierId: cost.supplier_id,
          shippingCostHt: toEur(cost.shipping_cost_ht),
          customsCostHt: toEur(cost.customs_cost_ht),
          otherCostHt: toEur(cost.other_cost_ht),
        };
      }),
    [supplierCosts]
  );

  useEffect(() => {
    if (consultationId) {
      void fetchSupplierCosts(consultationId);
    }
  }, [consultationId, fetchSupplierCosts]);

  return {
    supplierCosts,
    supplierCostInputs,
    loading,
    error,
    fetchSupplierCosts,
    upsertSupplierCost,
  };
}
