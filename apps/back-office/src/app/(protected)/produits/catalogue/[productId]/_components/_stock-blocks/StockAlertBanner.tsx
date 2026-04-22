'use client';

/**
 * StockAlertBanner — bannière d'alerte stock inline (onglet Stock produit).
 * Visible uniquement si stockAvailable < minStock (condition unifiée).
 *
 * Note : diverge intentionnellement de StockAlertsBanner (@verone/stock/cards)
 * qui fait son propre fetch via stock_alerts_unified_view. Ce composant reçoit
 * les données déjà chargées par le parent (ProductStockDashboard) pour éviter
 * un fetch dupliqué et rester cohérent avec les KPIs affichés.
 *
 * Sprint : BO-UI-PROD-STOCK-001
 */

import Link from 'next/link';

import { AlertTriangle } from 'lucide-react';

interface StockAlertBannerProps {
  /** Stock disponible = stockReal - stockForecastedOut - réservations (source de vérité unique) */
  stockAvailable: number;
  stockReal: number;
  minStock: number;
  draftOrderId: string | null;
  draftOrderNumber: string | null;
  shortageQuantity: number;
}

export function StockAlertBanner({
  stockAvailable,
  stockReal,
  minStock,
  draftOrderId,
  draftOrderNumber,
  shortageQuantity,
}: StockAlertBannerProps) {
  // Condition unifiée : même formule que StockKpiStrip (isBelowMin) et le parent
  if (stockAvailable >= minStock) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">
          <span className="font-semibold">
            Stock disponible sous seuil minimum
          </span>
          &nbsp;—&nbsp;disponible&nbsp;
          <span className="tabular-nums font-medium">{stockAvailable}</span>
          &nbsp;(réel&nbsp;
          <span className="tabular-nums font-medium">{stockReal}</span>
          ), seuil&nbsp;=&nbsp;
          <span className="tabular-nums font-medium">{minStock}</span>.
          {shortageQuantity > 0 && (
            <>
              &nbsp;Il faudrait commander&nbsp;
              <span className="tabular-nums font-medium">
                {shortageQuantity}
              </span>
              &nbsp;unité{shortageQuantity > 1 ? 's' : ''} supplémentaire
              {shortageQuantity > 1 ? 's' : ''}.
            </>
          )}
        </p>
      </div>

      <div className="shrink-0">
        {draftOrderId ? (
          <Link
            href={`/produits/sourcing/commandes/${draftOrderId}`}
            className="text-xs font-medium text-red-700 hover:text-red-800 underline whitespace-nowrap"
          >
            Voir PO brouillon {draftOrderNumber} →
          </Link>
        ) : (
          <Link
            href={`/produits/sourcing/nouveau`}
            className="text-xs font-medium text-red-700 hover:text-red-800 underline whitespace-nowrap"
          >
            Commander au fournisseur →
          </Link>
        )}
      </div>
    </div>
  );
}
