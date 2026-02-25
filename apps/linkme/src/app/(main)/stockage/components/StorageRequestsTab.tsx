'use client';

/**
 * StorageRequestsTab - Onglet "Mes demandes" dans la page Stockage LinkMe
 *
 * Affiche les demandes d'envoi de stock de l'affilie avec:
 * - Table: Produit, Quantite, Statut, Date, Actions
 * - Bouton "Annuler" sur les demandes pending
 *
 * @module StorageRequestsTab
 * @since 2026-02-25
 */

import Image from 'next/image';
import { Package, Loader2, X, Inbox } from 'lucide-react';

import {
  useAffiliateStorageRequests,
  useCancelStorageRequest,
  type StorageRequest,
} from '@/lib/hooks/use-storage-requests';

// Status config
const STATUS_CONFIG: Record<
  StorageRequest['status'],
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  approved: {
    label: 'Approuvee',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  rejected: { label: 'Rejetee', color: 'text-red-600', bgColor: 'bg-red-50' },
  cancelled: {
    label: 'Annulee',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  reception_created: {
    label: 'Reception creee',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
};

export function StorageRequestsTab(): JSX.Element {
  const { data: requests, isLoading } = useAffiliateStorageRequests();
  const cancelRequest = useCancelStorageRequest();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#183559] mb-1">
          Aucune demande
        </h3>
        <p className="text-sm text-gray-500">
          Vous n&apos;avez pas encore fait de demande d&apos;envoi de stock.
          Rendez-vous sur &quot;Mes Produits&quot; pour envoyer un produit
          approuve.
        </p>
      </div>
    );
  }

  const handleCancel = (requestId: string): void => {
    if (!confirm('Annuler cette demande ?')) return;
    void cancelRequest.mutateAsync(requestId).catch(err => {
      console.error('[StorageRequestsTab] Cancel failed:', err);
    });
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-10">
                Photo
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                Produit
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">
                Quantite
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                Statut
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                Date
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map(request => {
              const statusConfig = STATUS_CONFIG[request.status];
              return (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {request.product_image_url ? (
                      <Image
                        src={request.product_image_url}
                        alt={request.product_name ?? ''}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-[#183559]">
                      {request.product_name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {request.product_sku}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold">
                      {request.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    {request.status === 'rejected' &&
                      request.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          {request.rejection_reason}
                        </p>
                      )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString(
                        'fr-FR',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={cancelRequest.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {cancelRequest.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
