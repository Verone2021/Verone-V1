'use client';

/**
 * useProductGeneralDashboard — hook d'agrégation pour l'onglet Général.
 *
 * Charge en parallèle :
 *  1. Dernière PO reçue pour le produit
 *  2. 5 derniers mouvements de stock
 *  3. Timeline des événements (création, PO, prix, publication)
 *  4. Prix live site_internet + SIRET fournisseur
 *
 * Sprint : BO-UI-PROD-GENERAL-001 — Phase 2
 */

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ---------- Types exportés ----------

export interface LastPo {
  id: string;
  reference: string | null;
  purchasedAt: string | null;
  total: number | null;
  status: string | null;
}

export interface StockMove {
  id: string;
  date: string;
  type: 'in' | 'out' | 'adjust';
  qty: number;
  label: string;
}

export interface ActivityEvent {
  id: string;
  kind: 'creation' | 'po' | 'price' | 'publication' | 'stock';
  label: string;
  date: string;
}

export interface ProductGeneralDashboardData {
  lastPo: LastPo | null;
  stockMoves: StockMove[];
  events: ActivityEvent[];
  siteLivePriceHt: number | null;
  siteMarginPercent: number | null;
  supplierSiret: string | null;
}

// ---------- Helpers ----------

const MOVEMENT_TYPE_MAP: Record<string, 'in' | 'out' | 'adjust'> = {
  IN: 'in',
  OUT: 'out',
  ADJUST: 'adjust',
};

const REASON_CODE_LABELS: Record<string, string> = {
  purchase: 'Réception PO',
  purchase_reception: 'Réception PO',
  sale: 'Vente SO',
  sale_forecast: 'Vente SO (prév.)',
  manual_adjustment: 'Ajustement manuel',
  found_inventory: 'Trouvaille inventaire',
  lost_inventory: 'Perte inventaire',
  return: 'Retour client',
  initial_stock: 'Stock initial',
};

function deriveMoveLabel(
  reasonCode: string | null,
  movementType: string
): string {
  if (reasonCode && REASON_CODE_LABELS[reasonCode]) {
    return REASON_CODE_LABELS[reasonCode];
  }
  const type = MOVEMENT_TYPE_MAP[movementType] ?? 'adjust';
  if (type === 'in') return 'Entrée stock';
  if (type === 'out') return 'Sortie stock';
  return 'Ajustement stock';
}

// ---------- Types internes pour Supabase ----------
// Ces interfaces reflètent la shape réelle retournée par Supabase avec jointures.
// Les types générés Database['public']['Tables'][...]['Row'] ne capturent pas
// les colonnes de jointure (.select('..., purchase_orders!inner(...)')),
// donc on maintient ces interfaces locales avec leur shape exacte.

/** Shape imposé par le join Supabase — voir .select('id, purchased_at, purchase_orders!inner(...)') */
interface RawPpo {
  id: string;
  purchased_at: string;
  purchase_orders: {
    po_number: string;
    total_ttc: number;
    status: string;
  } | null;
}

/** Shape imposé par le join Supabase — voir .select('id, performed_at, movement_type, quantity_change, reason_code') */
interface RawStockMove {
  id: string;
  performed_at: string;
  movement_type: string;
  quantity_change: number;
  reason_code: string | null;
}

/** Shape imposé par le join Supabase — voir .select('id, negotiated_at, price, supplier_id, organisations!supplier_id(...)') */
interface RawSourcingHistory {
  id: string;
  negotiated_at: string | null;
  price: number;
  organisations: {
    legal_name: string | null;
    trade_name: string | null;
  } | null;
}

/** Shape imposé par le join Supabase — voir .select('id, created_at, publication_date, supplier_id, organisations!supplier_id(siret)') */
interface RawProduct {
  id: string;
  created_at: string | null;
  publication_date: string | null;
  organisations: {
    siret: string | null;
  } | null;
}

/** Shape imposé par le join Supabase — voir .select('custom_price_ht, sales_channels!inner(code)') */
interface RawChannelPricing {
  custom_price_ht: number | null;
}

// ---------- Hook ----------

export function useProductGeneralDashboard(productId: string | null): {
  data: ProductGeneralDashboardData;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<ProductGeneralDashboardData>({
    lastPo: null,
    stockMoves: [],
    events: [],
    siteLivePriceHt: null,
    siteMarginPercent: null,
    supplierSiret: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Requêtes parallèles
      const [
        poResult,
        stockResult,
        productResult,
        sourcingResult,
        channelResult,
      ] = await Promise.all([
        // 1. Dernière PO
        supabase
          .from('product_purchase_history')
          .select(
            'id, purchased_at, purchase_orders!inner(po_number, total_ttc, status)'
          )
          .eq('product_id', productId)
          .order('purchased_at', { ascending: false })
          .limit(1),

        // 2. 5 derniers mouvements stock
        supabase
          .from('stock_movements')
          .select(
            'id, performed_at, movement_type, quantity_change, reason_code'
          )
          .eq('product_id', productId)
          .order('performed_at', { ascending: false })
          .limit(5),

        // 3. Produit (créé_at, publication_date, siret fournisseur)
        supabase
          .from('products')
          .select(
            'id, created_at, publication_date, supplier_id, organisations!supplier_id(siret)'
          )
          .eq('id', productId)
          .limit(1)
          .maybeSingle(),

        // 4. Historique prix négociés
        supabase
          .from('sourcing_price_history')
          .select(
            'id, negotiated_at, price, supplier_id, organisations!supplier_id(legal_name, trade_name)'
          )
          .eq('product_id', productId)
          .not('negotiated_at', 'is', null)
          .order('negotiated_at', { ascending: false })
          .limit(5),

        // 5. Prix site live (inner join sur sales_channels pour filtrer par code)
        supabase
          .from('channel_pricing')
          .select('custom_price_ht, sales_channels!inner(code)')
          .eq('product_id', productId)
          .eq('is_active', true)
          .eq('sales_channels.code', 'site_internet')
          .limit(1),
      ]);

      // --- Last PO ---
      let lastPo: LastPo | null = null;
      if (!poResult.error && poResult.data && poResult.data.length > 0) {
        const raw = poResult.data[0] as RawPpo;
        if (raw.purchase_orders) {
          lastPo = {
            id: raw.id,
            reference: raw.purchase_orders.po_number,
            purchasedAt: raw.purchased_at,
            total:
              raw.purchase_orders.total_ttc != null
                ? Number(raw.purchase_orders.total_ttc)
                : null,
            status: raw.purchase_orders.status,
          };
        }
      }

      // --- Stock moves ---
      const rawMoves = (stockResult.data ?? []) as RawStockMove[];
      const stockMoves: StockMove[] = rawMoves.map(m => ({
        id: m.id,
        date: m.performed_at,
        type: MOVEMENT_TYPE_MAP[m.movement_type] ?? 'adjust',
        qty: Math.abs(m.quantity_change),
        label: deriveMoveLabel(m.reason_code, m.movement_type),
      }));

      // --- Product (pour events création/publication + siret) ---
      const rawProduct = productResult.data as RawProduct | null;
      const supplierSiret = rawProduct?.organisations?.siret ?? null;

      // --- Events timeline ---
      const events: ActivityEvent[] = [];

      // Event création produit
      if (rawProduct?.created_at) {
        events.push({
          id: `creation-${rawProduct.id}`,
          kind: 'creation',
          label: 'Produit créé',
          date: rawProduct.created_at,
        });
      }

      // Event publication
      if (rawProduct?.publication_date) {
        events.push({
          id: `publication-${rawProduct.id}`,
          kind: 'publication',
          label: 'Publié en ligne',
          date: rawProduct.publication_date,
        });
      }

      // Events PO reçues (depuis product_purchase_history, on ne charge que la 1ère ici)
      if (lastPo?.purchasedAt) {
        events.push({
          id: `po-${lastPo.id}`,
          kind: 'po',
          label: `PO reçue — ${lastPo.reference ?? '—'}`,
          date: lastPo.purchasedAt,
        });
      }

      // Events changements prix négociés
      const rawSourcing = (sourcingResult.data ?? []) as RawSourcingHistory[];
      for (const s of rawSourcing) {
        if (s.negotiated_at) {
          const supplierName =
            s.organisations?.trade_name ??
            s.organisations?.legal_name ??
            'fournisseur';
          events.push({
            id: `price-${s.id}`,
            kind: 'price',
            label: `Prix négocié ${Number(s.price).toFixed(0)}€ — ${supplierName}`,
            date: s.negotiated_at,
          });
        }
      }

      // Trier DESC + garder 5
      events.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const trimmedEvents = events.slice(0, 5);

      // --- Site live price ---
      let siteLivePriceHt: number | null = null;
      const channelRows = channelResult.data as RawChannelPricing[] | null;
      if (!channelResult.error && channelRows && channelRows.length > 0) {
        const raw = channelRows[0];
        siteLivePriceHt =
          raw.custom_price_ht != null ? Number(raw.custom_price_ht) : null;
      }

      setData({
        lastPo,
        stockMoves,
        events: trimmedEvents,
        siteLivePriceHt,
        siteMarginPercent: null, // calculé côté wrapper avec minimumSellingPrice
        supplierSiret,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erreur chargement dashboard';
      console.error('[useProductGeneralDashboard] Error:', msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchAll().catch((err: unknown) => {
      console.error('[useProductGeneralDashboard] Unhandled:', err);
    });
  }, [fetchAll]);

  return { data, isLoading, error };
}
