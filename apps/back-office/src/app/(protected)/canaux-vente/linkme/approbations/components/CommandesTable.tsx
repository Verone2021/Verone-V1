'use client';

import type {
  PendingOrder,
  OrderValidationStatus,
} from '../../hooks/use-linkme-order-actions';
import { CommandeRow } from './CommandeRow';

interface CommandesTableProps {
  orders: PendingOrder[];
  expandedRows: Set<string>;
  selectedStatus: OrderValidationStatus | 'all';
  isApprovePending: boolean;
  onToggle: (orderId: string) => void;
  onApprove: (order: PendingOrder, e: React.MouseEvent) => void;
  onRejectClick: (order: PendingOrder, e: React.MouseEvent) => void;
  onDeleteClick: (order: PendingOrder) => void;
}

export function CommandesTable({
  orders,
  expandedRows,
  selectedStatus,
  isApprovePending,
  onToggle,
  onApprove,
  onRejectClick,
  onDeleteClick,
}: CommandesTableProps) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-8" />
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Commande
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Demandeur
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Organisation
            </th>
            <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
              Montant
            </th>
            <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">
              Infos manquantes
            </th>
            <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map(order => (
            <CommandeRow
              key={order.id}
              order={order}
              isExpanded={expandedRows.has(order.id)}
              selectedStatus={selectedStatus}
              isApprovePending={isApprovePending}
              onToggle={onToggle}
              onApprove={onApprove}
              onRejectClick={onRejectClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
