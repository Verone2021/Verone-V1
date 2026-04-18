'use client';

/**
 * FournisseursTable — Table commandes fournisseurs responsive (T1 + T2 + T3 + T5)
 *
 * Technique T1 : ResponsiveDataView bascule table/cartes selon breakpoint lg.
 * Technique T2 : Colonnes masquables progressivement (hidden lg/xl/2xl).
 * Technique T3 : Actions via FournisseurActions (ResponsiveActionMenu breakpoint lg).
 * Technique T5 : Largeurs fluides, colonne principale absorbe l'espace, zero w-auto.
 *
 * HOOKS AUDIT :
 * - Aucun hook appele dans ce composant (zero useState/useEffect/useMemo).
 * - Les hooks sont dans les sous-composants si necessaire (aucun dans FournisseurActions).
 * - Aucun hook apres early return — ResponsiveDataView gere loading/empty.
 *
 * CAST SUPPRIME :
 * - Plus de "order as PurchaseOrderExtended" dans ce fichier.
 * - Props exigent PurchaseOrderExtended[] directement (fix CRITICAL v1 #3).
 */

import React from 'react';

import { ProductThumbnail } from '@verone/products';
import { Badge, ResponsiveDataView } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { cn } from '@verone/utils';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { ChevronDown, Package } from 'lucide-react';

import type { PurchaseOrderExtended, SortColumn, SortDirection } from './types';
import { statusColors, statusLabels } from './types';
import { FournisseurActions } from './FournisseurActions';
import { FournisseurMobileCard } from './FournisseurMobileCard';

// =====================================================================
// EMPTY STATE
// =====================================================================

function FournisseursEmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Aucune commande trouvee</p>
      <p className="text-sm">
        Cliquez sur &quot;Nouvelle commande&quot; pour en creer une
      </p>
    </div>
  );
}

// =====================================================================
// CELL PAIEMENT
// =====================================================================

function PaymentStatusCell({
  paymentStatus,
}: {
  paymentStatus: PurchaseOrderExtended['payment_status_v2'];
}) {
  if (paymentStatus === 'overpaid') {
    return <Badge className="text-xs bg-red-100 text-red-800">Surpaye</Badge>;
  }
  if (paymentStatus === 'paid') {
    return <Badge className="text-xs bg-green-100 text-green-800">Paye</Badge>;
  }
  if (paymentStatus === 'partially_paid') {
    return (
      <Badge className="text-xs bg-amber-100 text-amber-800">Partiel</Badge>
    );
  }
  return (
    <Badge className="text-xs bg-orange-100 text-orange-800">En attente</Badge>
  );
}

// =====================================================================
// PROPS
// =====================================================================

interface FournisseursTableProps {
  loading: boolean;
  filteredOrders: PurchaseOrderExtended[];
  expandedRows: Set<string>;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  renderSortIcon: (column: SortColumn) => React.ReactNode;
  onToggleRow: (id: string) => void;
  onView: (order: PurchaseOrderExtended) => void;
  onEdit: (order: PurchaseOrderExtended) => void;
  onValidate: (order: PurchaseOrderExtended) => void;
  onDevalidate: (order: PurchaseOrderExtended) => void;
  onReceive: (order: PurchaseOrderExtended) => void;
  onCancel: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onCancelRemainder: (order: PurchaseOrderExtended) => void;
  onLinkTransaction: (order: PurchaseOrderExtended) => void;
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function FournisseursTable({
  loading,
  filteredOrders,
  expandedRows,
  sortColumn,
  onSort,
  renderSortIcon,
  onToggleRow,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onReceive,
  onCancel,
  onDelete,
  onCancelRemainder,
  onLinkTransaction,
}: FournisseursTableProps) {
  void sortColumn; // transmis a renderSortIcon depuis page.tsx

  return (
    <ResponsiveDataView<PurchaseOrderExtended>
      data={filteredOrders}
      loading={loading}
      emptyMessage={<FournisseursEmptyState />}
      breakpoint="lg"
      renderCard={(order) => (
        // T1 : vrai composant React — peut contenir des hooks en securite
        <FournisseurMobileCard
          order={order}
          isExpanded={expandedRows.has(order.id)}
          sortColumn={null}
          onToggle={() => onToggleRow(order.id)}
          onView={() => onView(order)}
          onEdit={() => onEdit(order)}
          onValidate={() => onValidate(order)}
          onDevalidate={() => onDevalidate(order)}
          onReceive={() => onReceive(order)}
          onCancel={() => onCancel(order.id)}
          onDelete={() => onDelete(order.id)}
          onCancelRemainder={() => onCancelRemainder(order)}
          onLinkTransaction={() => onLinkTransaction(order)}
        />
      )}
      renderTable={(items) => (
        /* T5 : overflow-x-auto + largeurs explicites, zero w-auto */
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Expand chevron */}
                <TableHead className="w-10" />
                {/* N° commande — toujours visible */}
                <TableHead
                  className="w-[100px] cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => onSort('po_number')}
                >
                  <span className="inline-flex items-center gap-1">
                    N Commande
                    {renderSortIcon('po_number')}
                  </span>
                </TableHead>
                {/* Fournisseur — colonne principale, absorbe l'espace */}
                <TableHead className="min-w-[180px]">Fournisseur</TableHead>
                {/* Statut — toujours visible */}
                <TableHead className="w-[130px] whitespace-nowrap">
                  Statut
                </TableHead>
                {/* Paiement — T2 masque sous xl */}
                <TableHead className="hidden xl:table-cell w-[110px] whitespace-nowrap">
                  Paiement
                </TableHead>
                {/* Articles — T2 masque sous lg */}
                <TableHead className="hidden lg:table-cell w-[60px] whitespace-nowrap text-center">
                  Art.
                </TableHead>
                {/* Date commande — T2 masque sous lg */}
                <TableHead
                  className="hidden lg:table-cell w-[130px] cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => onSort('date')}
                >
                  <span className="inline-flex items-center gap-1">
                    Date commande
                    {renderSortIcon('date')}
                  </span>
                </TableHead>
                {/* Livraison — T2 masque sous 2xl */}
                <TableHead className="hidden 2xl:table-cell w-[110px] whitespace-nowrap">
                  Livraison
                </TableHead>
                {/* Montant TTC — toujours visible */}
                <TableHead
                  className="w-[120px] cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => onSort('amount')}
                >
                  <span className="inline-flex items-center gap-1">
                    Montant TTC
                    {renderSortIcon('amount')}
                  </span>
                </TableHead>
                {/* Actions — toujours visible */}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => {
                const orderItems = order.purchase_order_items ?? [];
                const hasSamples = orderItems.some(item => item.sample_type);
                const isExpanded = expandedRows.has(order.id);

                return (
                  <React.Fragment key={order.id}>
                    <TableRow>
                      {/* Chevron expansion */}
                      <TableCell className="w-10">
                        {orderItems.length > 0 && (
                          <button
                            onClick={() => onToggleRow(order.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-gray-500 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        )}
                      </TableCell>

                      {/* N° commande */}
                      <TableCell>
                        <span className="text-xs font-mono font-medium break-all leading-tight">
                          {order.po_number}
                        </span>
                      </TableCell>

                      {/* Fournisseur */}
                      <TableCell>
                        <div className="text-sm font-medium leading-tight break-words">
                          {order.organisations
                            ? getOrganisationDisplayName(order.organisations)
                            : 'Non défini'}
                        </div>
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              'text-xs',
                              statusColors[order.status]
                            )}
                          >
                            {statusLabels[order.status]}
                          </Badge>
                          {hasSamples && (
                            <Badge variant="secondary" className="text-xs">
                              Echantillon
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Paiement — T2 hidden xl */}
                      <TableCell className="hidden xl:table-cell">
                        <PaymentStatusCell
                          paymentStatus={order.payment_status_v2}
                        />
                      </TableCell>

                      {/* Articles — T2 hidden lg */}
                      <TableCell className="hidden lg:table-cell text-center whitespace-nowrap">
                        <span className="text-xs font-medium">
                          {orderItems.length}
                        </span>
                        <span className="text-muted-foreground text-[10px] ml-0.5">
                          ref.
                        </span>
                      </TableCell>

                      {/* Date commande — T2 hidden lg */}
                      <TableCell className="hidden lg:table-cell whitespace-nowrap">
                        <span className="text-xs">
                          {formatDate(order.order_date ?? order.created_at)}
                        </span>
                      </TableCell>

                      {/* Livraison — T2 hidden 2xl */}
                      <TableCell className="hidden 2xl:table-cell whitespace-nowrap">
                        <span className="text-xs">
                          {['received', 'partially_received'].includes(
                            order.status
                          ) && order.received_at ? (
                            <span className="text-green-700">
                              {formatDate(order.received_at)}
                            </span>
                          ) : order.expected_delivery_date ? (
                            formatDate(order.expected_delivery_date)
                          ) : (
                            <span className="text-muted-foreground">
                              Non définie
                            </span>
                          )}
                        </span>
                      </TableCell>

                      {/* Montant TTC */}
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs font-medium">
                          {formatCurrency(order.total_ttc)}
                        </span>
                      </TableCell>

                      {/* Actions — T3 via FournisseurActions */}
                      <TableCell>
                        <FournisseurActions
                          order={order}
                          onView={() => onView(order)}
                          onEdit={() => onEdit(order)}
                          onValidate={() => onValidate(order)}
                          onDevalidate={() => onDevalidate(order)}
                          onReceive={() => onReceive(order)}
                          onCancel={() => onCancel(order.id)}
                          onDelete={() => onDelete(order.id)}
                          onCancelRemainder={() => onCancelRemainder(order)}
                          onLinkTransaction={() => onLinkTransaction(order)}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Ligne expansion — articles du PO */}
                    {isExpanded && orderItems.length > 0 && (
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={10} className="p-0">
                          <div className="py-3 px-6 space-y-2">
                            {orderItems.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 text-sm py-1"
                              >
                                <ProductThumbnail
                                  src={item.products?.primary_image_url}
                                  alt={item.products?.name ?? 'Produit'}
                                  size="xs"
                                />
                                <span className="flex-1 font-medium">
                                  {item.products?.name ?? 'Produit inconnu'}
                                </span>
                                <span className="text-muted-foreground">
                                  x{item.quantity}
                                </span>
                                <span className="font-medium w-24 text-right">
                                  {formatCurrency(item.total_ht ?? 0)}
                                </span>
                                {item.sample_type && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {item.sample_type === 'internal'
                                      ? 'Éch. interne'
                                      : 'Éch. client'}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    />
  );
}
