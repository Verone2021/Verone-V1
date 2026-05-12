/**
 * Page Admin - Demandes de Paiement LinkMe
 *
 * Gestion des demandes de versement des affiliés :
 * - Liste de toutes les demandes
 * - Filtres par statut
 * - Actions : voir facture, traiter paiement (total ou partiel), annuler
 *
 * @module PaymentRequestsAdminPage
 * @since 2025-12-11 · updated 2026-05-13 (partially_paid + ProcessPaymentModal)
 */

'use client';

import { useState } from 'react';

import { Filter } from 'lucide-react';

import {
  usePaymentRequestsAdmin,
  type PaymentRequestAdmin,
  type PaymentRequestStatus,
} from '../hooks/use-payment-requests-admin';
import { ProcessPaymentModal } from './_components/ProcessPaymentModal';
import { PaymentRequestsStats } from './_components/PaymentRequestsStats';
import { PaymentRequestsTable } from './_components/PaymentRequestsTable';

export default function PaymentRequestsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<
    PaymentRequestStatus | 'all'
  >('all');
  const [selectedRequest, setSelectedRequest] =
    useState<PaymentRequestAdmin | null>(null);

  const {
    data: requests,
    isLoading,
    refetch,
  } = usePaymentRequestsAdmin(statusFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Demandes de paiement LinkMe
          </h1>
          <p className="text-gray-500 text-sm">
            Gérez les demandes de versement des affiliés
          </p>
        </div>
      </div>

      <PaymentRequestsStats requests={requests} />

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={e =>
            setStatusFilter(e.target.value as PaymentRequestStatus | 'all')
          }
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente de facture</option>
          <option value="invoice_received">Facture reçue</option>
          <option value="partially_paid">Partiellement payée</option>
          <option value="paid">Payées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <PaymentRequestsTable
        requests={requests}
        isLoading={isLoading}
        onProcessPayment={setSelectedRequest}
      />

      <ProcessPaymentModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        alreadyPaidTTC={selectedRequest?.alreadyPaidTTC ?? 0}
        onClose={() => setSelectedRequest(null)}
        onSuccess={() => {
          void refetch().catch(err => {
            console.error('[DemandesPaiement] refetch failed:', err);
          });
        }}
      />
    </div>
  );
}
