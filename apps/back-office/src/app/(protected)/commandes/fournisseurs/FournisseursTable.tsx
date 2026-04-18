'use client';

import type { PurchaseOrder } from '@verone/orders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ResponsiveDataView,
} from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { Package } from 'lucide-react';

import type { PurchaseOrderExtended, SortColumn, SortDirection } from './types';
import { FournisseurMobileCard } from './FournisseurMobileCard';
import { FournisseursTableRow } from './FournisseursTableRow';

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

// Zero hook dans ce composant. renderTable/renderCard n'instancient QUE
// des composants (pas de logique, pas de hooks dans les callbacks).
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
          skeletonCount={3}
          breakpoint="lg"
          emptyMessage={
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          }
          renderTable={items => (
            <div className="overflow-x-auto">
              <Table className="w-full [&_th]:px-2.5 [&_td]:px-2.5">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => onSort('po_number')}
                    >
                      <span className="inline-flex items-center gap-1">
                        N Commande
                        {renderSortIcon('po_number')}
                      </span>
                    </TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="whitespace-nowrap">Statut</TableHead>
                    <TableHead className="hidden xl:table-cell whitespace-nowrap">
                      Paiement
                    </TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap text-center">
                      Art.
                    </TableHead>
                    <TableHead
                      className="hidden lg:table-cell cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => onSort('date')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date commande
                        {renderSortIcon('date')}
                      </span>
                    </TableHead>
                    <TableHead className="hidden 2xl:table-cell whitespace-nowrap">
                      Livraison
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => onSort('amount')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Montant TTC
                        {renderSortIcon('amount')}
                      </span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(order => (
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
              order={order as PurchaseOrderExtended}
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
        />
      </CardContent>
    </Card>
  );
}
