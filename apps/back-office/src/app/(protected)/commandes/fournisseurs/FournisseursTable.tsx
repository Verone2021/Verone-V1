'use client';

import type { PurchaseOrder } from '@verone/orders';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ResponsiveDataView,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { Eye, Package } from 'lucide-react';

import type { PurchaseOrderExtended, SortColumn, SortDirection } from './types';
import { statusColors, statusLabels } from './types';
import { FournisseursTableRow } from './FournisseursTableRow';
import { PurchaseOrderActionMenu } from './components/PurchaseOrderActionMenu';

interface FournisseursTableProps {
  loading: boolean;
  filteredOrders: PurchaseOrder[];
  expandedRows: Set<string>;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  renderSortIcon: (column: SortColumn) => React.ReactNode;
  onToggleRow: (id: string) => void;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onValidate: (order: PurchaseOrder) => void;
  onDevalidate: (order: PurchaseOrder) => void;
  onReceive: (order: PurchaseOrder) => void;
  onCancel: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onCancelRemainder: (order: PurchaseOrder) => void;
  onLinkTransaction: (order: PurchaseOrder) => void;
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

interface FournisseurMobileCardProps {
  order: PurchaseOrder;
  onView: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onValidate: (order: PurchaseOrder) => void;
  onDevalidate: (order: PurchaseOrder) => void;
  onReceive: (order: PurchaseOrder) => void;
  onCancel: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  onCancelRemainder: (order: PurchaseOrder) => void;
  onLinkTransaction: (order: PurchaseOrder) => void;
}

function FournisseurMobileCard({
  order,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onReceive,
  onCancel,
  onDelete,
  onCancelRemainder,
  onLinkTransaction,
}: FournisseurMobileCardProps) {
  const extended = order as PurchaseOrderExtended;

  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onView(order)}
    >
      {/* Header: N° Commande + Montant TTC */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="font-mono text-xs font-medium">{order.po_number}</div>
          <div className="text-sm font-medium leading-tight">
            {order.organisations
              ? getOrganisationDisplayName(order.organisations)
              : 'Non défini'}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-medium text-sm">
            {formatCurrency(order.total_ttc)}
          </div>
        </div>
      </div>

      {/* Statut + Date commande */}
      <div className="flex items-center justify-between gap-2">
        <Badge className={`text-xs ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {order.order_date
            ? formatDate(order.order_date)
            : formatDate(order.created_at)}
        </span>
      </div>

      {/* Actions */}
      <div
        className="pt-2 border-t flex justify-end"
        onClick={e => e.stopPropagation()}
      >
        <PurchaseOrderActionMenu
          order={extended}
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
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FournisseursTable({
  loading,
  filteredOrders,
  expandedRows,
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
  const emptyNode = (
    <div className="text-center py-8">
      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-500">Aucune commande trouvée</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes Fournisseurs</CardTitle>
        <CardDescription>
          {filteredOrders.length} commande(s) trouvée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveDataView<PurchaseOrder>
          data={filteredOrders}
          loading={loading}
          emptyMessage={emptyNode}
          breakpoint="md"
          renderTable={data => (
            <div className="overflow-x-auto">
              <Table className="w-full [&_th]:px-2.5 [&_td]:px-2.5">
                <TableHeader>
                  <TableRow>
                    {/* Expand chevron */}
                    <TableHead className="w-10" />
                    {/* T2 — toujours visible */}
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap w-[100px]"
                      onClick={() => onSort('po_number')}
                    >
                      <span className="inline-flex items-center gap-1">
                        N Commande
                        {renderSortIcon('po_number')}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-[160px]">Fournisseur</TableHead>
                    {/* T2 — toujours visible */}
                    <TableHead className="whitespace-nowrap w-[120px]">
                      Statut
                    </TableHead>
                    {/* T2 — hidden < lg */}
                    <TableHead className="hidden lg:table-cell whitespace-nowrap w-[110px]">
                      Paiement
                    </TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap text-center w-[60px]">
                      Art.
                    </TableHead>
                    {/* T2 — hidden < xl */}
                    <TableHead
                      className="hidden xl:table-cell cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => onSort('date')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date commande
                        {renderSortIcon('date')}
                      </span>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell whitespace-nowrap">
                      Livraison
                    </TableHead>
                    {/* T2 — toujours visible */}
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap w-[110px]"
                      onClick={() => onSort('amount')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Montant TTC
                        {renderSortIcon('amount')}
                      </span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(order => (
                    <FournisseursTableRow
                      key={order.id}
                      order={order}
                      isExpanded={expandedRows.has(order.id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          renderCard={order => (
            <FournisseurMobileCard
              key={order.id}
              order={order}
              onView={onView}
              onEdit={onEdit}
              onValidate={onValidate}
              onDevalidate={onDevalidate}
              onReceive={onReceive}
              onCancel={onCancel}
              onDelete={onDelete}
              onCancelRemainder={onCancelRemainder}
              onLinkTransaction={onLinkTransaction}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}
