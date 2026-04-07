'use client';

import { useState } from 'react';

import { Badge } from '@verone/ui';
import { Loader2, Clock, Send } from 'lucide-react';

import {
  usePendingStorageRequests,
  useApproveStorageRequest,
  useRejectStorageRequest,
} from '../../../hooks/use-storage-requests-admin';

import { RejectDialog } from './RejectDialog';
import { RequestRow } from './RequestRow';

export function StorageRequestsAdminTab(): React.ReactElement {
  const { data: pendingRequests, isLoading: pendingLoading } =
    usePendingStorageRequests('pending');
  const { data: allRequests, isLoading: allLoading } =
    usePendingStorageRequests();
  const approveRequest = useApproveStorageRequest();
  const rejectRequest = useRejectStorageRequest();

  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (requestId: string): void => {
    if (!confirm('Approuver cette demande ? Une reception pending sera creee.'))
      return;
    void approveRequest.mutateAsync(requestId).catch(err => {
      console.error('[StorageRequestsAdminTab] Approve failed:', err);
      alert(
        `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    });
  };

  const handleRejectConfirm = (): void => {
    if (!rejectDialogId) return;
    void rejectRequest
      .mutateAsync({
        requestId: rejectDialogId,
        reason: rejectReason || undefined,
      })
      .then(() => {
        setRejectDialogId(null);
        setRejectReason('');
      })
      .catch(err => {
        console.error('[StorageRequestsAdminTab] Reject failed:', err);
        alert(
          `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
        );
      });
  };

  const treatedRequests = (allRequests ?? []).filter(
    r => r.status !== 'pending'
  );

  if (pendingLoading || allLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-500" />
          Demandes en attente
          {(pendingRequests?.length ?? 0) > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300">
              {pendingRequests?.length}
            </Badge>
          )}
        </h2>

        {(!pendingRequests || pendingRequests.length === 0) && (
          <div className="bg-white rounded-lg p-6 text-center border">
            <Send className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune demande en attente</p>
          </div>
        )}

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Affilie
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Produit
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-gray-600">
                    Qte
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Notes
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingRequests.map(request => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onApprove={() => handleApprove(request.id)}
                    onReject={() => setRejectDialogId(request.id)}
                    isApproving={approveRequest.isPending}
                    showActions
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique */}
      {treatedRequests.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Historique
          </h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Affilie
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Produit
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-gray-600">
                    Qte
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Statut
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {treatedRequests.slice(0, 20).map(request => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialogId && (
        <RejectDialog
          rejectReason={rejectReason}
          onReasonChange={setRejectReason}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setRejectDialogId(null);
            setRejectReason('');
          }}
          isPending={rejectRequest.isPending}
        />
      )}
    </div>
  );
}
