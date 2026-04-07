'use client';

import Link from 'next/link';

import {
  Loader2,
  Plus,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { LinkMeOrder } from '../../../hooks/use-linkme-orders';
import { ITEMS_PER_PAGE, type TabType } from './commandes.constants';
import { CommandeOrderRow } from './CommandeOrderRow';

interface CommandesListProps {
  orders: LinkMeOrder[];
  totalCount: number;
  totalPages: number;
  page: number;
  isLoading: boolean;
  error: Error | null;
  activeTab: TabType;
  expandedOrderId: string | null;
  canViewCommissions: boolean;
  onToggleOrder: (id: string) => void;
  onOpenDetail: (order: LinkMeOrder, e: React.MouseEvent) => void;
  onPageChange: (updater: (p: number) => number) => void;
}

export function CommandesList({
  orders,
  totalCount,
  totalPages,
  page,
  isLoading,
  error,
  activeTab,
  expandedOrderId,
  canViewCommissions,
  onToggleOrder,
  onOpenDetail,
  onPageChange,
}: CommandesListProps) {
  return (
    <div data-tour="orders-list" className="p-4">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">
            Erreur lors du chargement des commandes.
          </p>
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune commande</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'all'
              ? 'Créez votre première vente pour commencer'
              : `Aucune commande dans cette catégorie`}
          </p>
          {activeTab === 'all' && (
            <Link
              href="/commandes/nouvelle"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5DBEBB] to-[#4AA8A5] text-white rounded-xl hover:from-[#4DA9A6] hover:to-[#3D9895] text-sm shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Link>
          )}
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map(order => (
            <CommandeOrderRow
              key={order.id}
              order={order}
              isExpanded={expandedOrderId === order.id}
              canViewCommissions={canViewCommissions}
              onToggle={onToggleOrder}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} commande{totalCount > 1 ? 's' : ''} au total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <span className="text-sm text-gray-600 px-2">
              Page {page + 1} sur {totalPages}
            </span>
            <button
              onClick={() => onPageChange(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
