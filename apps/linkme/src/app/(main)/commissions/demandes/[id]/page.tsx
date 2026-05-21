/**
 * Page Détail d'une demande de versement — Côté affilié LinkMe
 *
 * Affiche :
 * - En-tête : numéro, statut, montant total
 * - Restant dû (si statut partially_paid)
 * - Commissions incluses dans la demande
 * - Historique des virements reçus
 *
 * @module PaymentRequestDetailPage
 * @since 2026-05-21
 */

'use client';

import { use } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
} from 'lucide-react';

import {
  usePaymentRequestDetail,
  usePaymentHistory,
} from '../../../../../lib/hooks/use-payment-requests';
import type { PaymentRequestStatus } from '../../../../../types/analytics';
import {
  formatCurrency,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../../../../types/analytics';
import { CommissionsSection } from './_components/CommissionsSection';
import { PaymentHistorySection } from './_components/PaymentHistorySection';

// ============================================================================
// Badge de statut
// ============================================================================

function StatusBadge({ status }: { status: PaymentRequestStatus }) {
  const config: Record<
    PaymentRequestStatus,
    { icon: typeof Clock; color: string; bg: string }
  > = {
    pending: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    partially_paid: {
      icon: CircleDollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    paid: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
  };

  const { icon: Icon, color, bg } = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color} ${bg}`}
    >
      <Icon className="h-4 w-4" />
      {PAYMENT_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

// ============================================================================
// Page principale
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const {
    data: request,
    isLoading: requestLoading,
    error: requestError,
  } = usePaymentRequestDetail(id);

  const { data: payments = [], isLoading: paymentsLoading } =
    usePaymentHistory(id);

  // Calcul du restant dû
  const totalPaid = payments.reduce((sum, p) => sum + p.amountTTC, 0);
  const remaining = request ? request.totalAmountTTC - totalPaid : 0;

  // ── État de chargement ──────────────────────────────────────────────────────
  if (requestLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Erreur ou demande introuvable ───────────────────────────────────────────
  if (requestError ?? !request) {
    return (
      <div className="p-4 space-y-5">
        <Link
          href="/commissions/demandes"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-gray-700 font-medium">Demande introuvable</p>
          <p className="text-sm text-gray-500">
            Cette demande n&apos;existe pas ou vous n&apos;y avez pas accès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      {/* ── Navigation retour ─────────────────────────────────────────────── */}
      <Link
        href="/commissions/demandes"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 min-h-[44px] md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      {/* ── En-tête ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {request.requestNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Demande de versement</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Montant total */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-600">Montant total TTC</span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(request.totalAmountTTC)}
          </span>
        </div>

        {/* Restant dû — visible seulement si partiellement payée */}
        {request.status === 'partially_paid' && (
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            <span className="text-sm font-medium text-blue-800">
              Restant dû
            </span>
            <span className="text-lg font-bold text-blue-700">
              {formatCurrency(Math.max(0, remaining))}
            </span>
          </div>
        )}

        {/* Statut facture */}
        {request.invoiceReceived ? (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <FileText className="h-4 w-4" />
            Facture déposée
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Upload className="h-4 w-4" />
            <span>
              Facture non déposée — rendez-vous sur{' '}
              <Link
                href="/commissions/demandes"
                className="underline hover:no-underline"
              >
                la liste
              </Link>{' '}
              pour l&apos;uploader.
            </span>
          </div>
        )}
      </div>

      {/* ── Commissions incluses ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Commissions incluses ({request.commissions?.length ?? 0})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <CommissionsSection commissions={request.commissions ?? []} />
        </div>
      </section>

      {/* ── Historique des virements reçus ────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Virements reçus ({payments.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <PaymentHistorySection
            payments={payments}
            isLoading={paymentsLoading}
          />
        </div>
      </section>
    </div>
  );
}
