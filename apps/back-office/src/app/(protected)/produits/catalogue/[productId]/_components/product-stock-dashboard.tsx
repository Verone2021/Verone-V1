'use client';

/**
 * ProductStockDashboard — orchestrateur onglet Stock.
 *
 * Design cible : stitch-stock-v3-2026-04-22.png (validé Romeo)
 * Sprint : BO-UI-PROD-STOCK-001
 *
 * Layout : rail gauche sticky (GeneralRail réutilisé) + body 4 lignes de blocs.
 */

import { useEffect, useCallback, useMemo, useState } from 'react';

import {
  useStockMovements,
  useStockReservations,
  useStockAlerts,
  QuickStockMovementModal,
  type StockMovement,
  type StockReservation,
} from '@verone/stock';

import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { StockAlertBanner } from './_stock-blocks/StockAlertBanner';
import { StockKpiStrip } from './_stock-blocks/StockKpiStrip';
import { StockMovementsCard } from './_stock-blocks/StockMovementsCard';
import { StockReorderCard } from './_stock-blocks/StockReorderCard';
import { StockReservationsCard } from './_stock-blocks/StockReservationsCard';
import { StockSettingsCard } from './_stock-blocks/StockSettingsCard';
import type { Product, ProductRow } from './types';

interface ProductStockDashboardProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductStockDashboard({
  product,
  completionPercentage,
  onProductUpdate,
  onTabChange,
}: ProductStockDashboardProps) {
  // ── Hooks stock ──────────────────────────────────────────────────
  const {
    movements,
    stats: movementsStats,
    fetchMovements,
    fetchStats: fetchMovementsStats,
  } = useStockMovements();

  const { reservations, fetchReservations, releaseReservation } =
    useStockReservations();

  const { alerts, fetchAlerts } = useStockAlerts();

  // ── Modal mouvement manuel ────────────────────────────────────────
  const [showMovementModal, setShowMovementModal] = useState(false);

  // ── Chargement initial ───────────────────────────────────────────
  useEffect(() => {
    void fetchMovements({ product_id: product.id }).catch(console.error);
    void fetchMovementsStats({ product_id: product.id }).catch(console.error);
    void fetchReservations({ product_id: product.id, is_active: true }).catch(
      console.error
    );
    void fetchAlerts().catch(console.error);
    // fetchMovements / fetchMovementsStats / fetchReservations / fetchAlerts sont
    // wrappées dans useCallback avec des deps stables (createClient() via useMemo,
    // product.id non utilisé comme dep interne). Les inclure causerait une boucle
    // infinie car chaque appel réinitialise l'état du hook (nouvelles références).
    // Safe à exclure — déclenchement uniquement sur changement de product.id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // ── Données dérivées ─────────────────────────────────────────────

  // Alerte pour CE produit
  const productAlert = alerts.find(a => a.product_id === product.id) ?? null;

  // Réservations actives pour ce produit
  const activeReservations: StockReservation[] = reservations.filter(
    r => r.product_id === product.id && r.released_at === null
  );

  const reservationsTotal = activeReservations.reduce(
    (sum, r) => sum + r.reserved_quantity,
    0
  );

  // Mouvements du produit courant
  const recentMovements: StockMovement[] = movements.filter(
    m => m.product_id === product.id
  );
  const lastMovement = recentMovements[0] ?? null;

  // Stats mouvements
  const movementsStatsForProduct = {
    in: movementsStats?.total_in ?? 0,
    out: movementsStats?.total_out ?? 0,
    adjust: movementsStats?.total_adjustments ?? 0,
    transfer: movementsStats?.total_transfers ?? 0,
  };

  // Données stock
  const stockReal = product.stock_real ?? 0;
  const minStock = product.min_stock ?? 0;
  // stockAvailable = source de vérité unique pour la condition d'alerte
  // (inclut stock_forecasted_out + réservations actives, plus précis que stockReal)
  const stockAvailable =
    stockReal - (product.stock_forecasted_out ?? 0) - reservationsTotal;

  // Données alerte
  const draftOrderId = productAlert?.draft_order_id ?? null;
  const draftOrderNumber = productAlert?.draft_order_number ?? null;
  const shortageQuantity = productAlert?.shortage_quantity ?? 0;
  const isAlertActive =
    productAlert !== null &&
    (productAlert.alert_type === 'low_stock' ||
      productAlert.alert_type === 'out_of_stock' ||
      productAlert.alert_type === 'low_stock_forecast');

  // Suggestion réappro
  const reorderPoint = product.reorder_point ?? 0;
  const stockForecastedOut = product.stock_forecasted_out ?? 0;
  const suggestedQty = Math.max(
    reorderPoint - stockReal + stockForecastedOut,
    shortageQuantity,
    0
  );

  // ── Handlers ─────────────────────────────────────────────────────
  const handleRefreshAll = useCallback(() => {
    void fetchMovements({ product_id: product.id }).catch(console.error);
    void fetchMovementsStats({ product_id: product.id }).catch(console.error);
    void fetchReservations({ product_id: product.id, is_active: true }).catch(
      console.error
    );
    void fetchAlerts().catch(console.error);
  }, [
    product.id,
    fetchMovements,
    fetchMovementsStats,
    fetchReservations,
    fetchAlerts,
  ]);

  const handleReleaseReservation = useCallback(
    (reservationId: string) => {
      void releaseReservation(reservationId)
        .then(() =>
          fetchReservations({ product_id: product.id, is_active: true })
        )
        .catch(console.error);
    },
    [releaseReservation, fetchReservations, product.id]
  );

  const handleOpenMovementModal = useCallback(() => {
    setShowMovementModal(true);
  }, []);

  const handleCloseMovementModal = useCallback(() => {
    setShowMovementModal(false);
  }, []);

  // ── Rail gauche (tabEntries) ──────────────────────────────────────
  const tabEntries = useMemo(
    () => [
      { id: 'general', label: 'Général', percent: completionPercentage },
      {
        id: 'descriptions',
        label: 'Descriptions',
        percent: product.description ? 100 : 0,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        percent: product.dimensions ? 80 : 30,
      },
      {
        id: 'stock',
        label: 'Stock',
        percent: product.min_stock != null ? 100 : 50,
      },
      {
        id: 'images',
        label: 'Images',
        percent: product.has_images ? 100 : 0,
      },
      {
        id: 'publication',
        label: 'Publication',
        percent: product.is_published_online ? 100 : 60,
      },
    ],
    [product, completionPercentage]
  );

  // Dernier mouvement d'achat (pour ReorderCard)
  const lastPurchaseMovement = recentMovements.find(
    m =>
      m.movement_type === 'IN' &&
      (m.reason_code === 'purchase_reception' ||
        m.reference_type === 'purchase_order')
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Rail gauche sticky */}
        <GeneralRail
          productId={product.id}
          productName={product.name}
          sku={product.sku ?? ''}
          completionPercentage={completionPercentage}
          tabEntries={tabEntries}
          variantGroupId={product.variant_group_id ?? null}
          variants={[]}
          onTabClick={onTabChange}
          onExportPdf={undefined}
          hasSourcing={Boolean(product.consultation_id)}
        />

        {/* Body principal */}
        <div className="flex-1 space-y-4 min-w-0 pb-8">
          {/* Bloc 0 — Bannière alerte (conditionnelle) */}
          {/* Condition unifiée : stockAvailable < minStock (source de vérité unique) */}
          {stockAvailable < minStock && (
            <StockAlertBanner
              stockAvailable={stockAvailable}
              stockReal={stockReal}
              minStock={minStock}
              draftOrderId={draftOrderId}
              draftOrderNumber={draftOrderNumber}
              shortageQuantity={shortageQuantity}
            />
          )}

          {/* Bloc 1 — KPI Strip */}
          <StockKpiStrip
            product={product}
            reservationsTotal={reservationsTotal}
            lastMovementDate={lastMovement?.performed_at ?? null}
            lastMovementQty={lastMovement?.quantity_change ?? null}
            onProductUpdate={onProductUpdate}
          />

          {/* Bloc 2 — Mouvements (col 8) + Réservations (col 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <StockMovementsCard
                productId={product.id}
                productName={product.name}
                productSku={product.sku}
                movements={recentMovements.slice(0, 10)}
                stats={movementsStatsForProduct}
              />
            </div>
            <div className="lg:col-span-4">
              <StockReservationsCard
                reservations={activeReservations}
                totalQty={reservationsTotal}
                onRelease={handleReleaseReservation}
              />
            </div>
          </div>

          {/* Bloc 3 — Réappro (col 6) + Paramètres (col 6) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StockReorderCard
              productId={product.id}
              alertPriority={null}
              shortageQuantity={shortageQuantity}
              suggestedQty={suggestedQty}
              draftOrderId={draftOrderId}
              draftOrderNumber={draftOrderNumber}
              quantityInDraft={productAlert?.quantity_in_draft ?? null}
              lastPurchaseDate={lastPurchaseMovement?.performed_at ?? null}
              lastPurchaseQty={
                lastPurchaseMovement != null
                  ? Math.abs(lastPurchaseMovement.quantity_change)
                  : null
              }
              lastPurchasePrice={lastPurchaseMovement?.unit_cost ?? null}
              isAlertActive={isAlertActive}
              onSuccess={handleRefreshAll}
            />
            <StockSettingsCard
              product={product}
              productId={product.id}
              onProductUpdate={onProductUpdate}
              onOpenMovementModal={handleOpenMovementModal}
            />
          </div>
        </div>
      </div>

      {/* Modal mouvement manuel */}
      <QuickStockMovementModal
        isOpen={showMovementModal}
        onClose={handleCloseMovementModal}
        onSuccess={handleRefreshAll}
        productId={product.id}
        productName={product.name}
        currentStock={stockReal}
      />
    </>
  );
}
