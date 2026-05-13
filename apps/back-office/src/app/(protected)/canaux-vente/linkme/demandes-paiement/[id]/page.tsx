'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  Loader2,
  Receipt,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

import {
  useCancelPaymentRequestAdmin,
  usePaymentHistory,
  type PaymentRecord,
} from '../../hooks/use-payment-requests-admin';
import { ProcessPaymentModal } from '../_components/ProcessPaymentModal';
import { StatusBadge } from '../_components/StatusBadge';
import { formatCurrency, formatDate } from '../_components/helpers';
import type { PaymentRequestStatus } from '../_components/types';

interface CommissionRow {
  order_number: string;
  order_date: string | null;
  order_amount_ht: number;
  total_payout_ht: number;
  total_payout_ttc: number;
}

interface PaymentRequestDetail {
  id: string;
  request_number: string;
  affiliate_name: string;
  affiliate_email: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: PaymentRequestStatus;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
}

interface ItemRow {
  commission_amount_ttc: number;
  linkme_commissions: {
    order_number: string;
    order_date: string | null;
    order_amount_ht: number;
    total_payout_ht: number;
    total_payout_ttc: number;
  } | null;
}

export default function PaymentRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = useState<PaymentRequestDetail | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const { mutateAsync: cancelRequest, isPending: isCancelling } =
    useCancelPaymentRequestAdmin();

  const { data: paymentsRaw } = usePaymentHistory(id);
  const payments: PaymentRecord[] = paymentsRaw ?? [];

  const alreadyPaidTTC = payments.reduce(
    (sum: number, p: PaymentRecord) => sum + p.amount_ttc,
    0
  );

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      type PRRaw = {
        id: string;
        request_number: string;
        total_amount_ht: number;
        total_amount_ttc: number;
        status: string;
        payment_reference: string | null;
        paid_at: string | null;
        created_at: string;
        notes: string | null;
        linkme_affiliates: {
          display_name: string;
          email: string | null;
        } | null;
      };

      const { data: prRows, error: prError } = await supabase
        .from('linkme_payment_requests')
        .select(
          `id, request_number, total_amount_ht, total_amount_ttc, status,
           payment_reference, paid_at, created_at, notes,
           linkme_affiliates ( display_name, email )`
        )
        .eq('id', id)
        .limit(1)
        .returns<PRRaw[]>();

      if (prError) throw prError;

      const raw = prRows?.[0];
      if (!raw) throw new Error('Not found');

      setRequest({
        id: raw.id,
        request_number: raw.request_number,
        affiliate_name: raw.linkme_affiliates?.display_name ?? 'Affilié',
        affiliate_email: raw.linkme_affiliates?.email ?? '',
        total_amount_ht: raw.total_amount_ht ?? 0,
        total_amount_ttc: raw.total_amount_ttc ?? 0,
        status: raw.status as PaymentRequestStatus,
        payment_reference: raw.payment_reference,
        paid_at: raw.paid_at,
        created_at: raw.created_at,
        notes: raw.notes,
      });

      const { data: itemsData, error: itemsError } = await supabase
        .from('linkme_payment_request_items')
        .select(
          `commission_amount_ttc,
           linkme_commissions (
             order_number, order_date, order_amount_ht,
             total_payout_ht, total_payout_ttc
           )`
        )
        .eq('payment_request_id', id)
        .returns<ItemRow[]>();

      if (itemsError) throw itemsError;

      const rows = itemsData ?? [];
      const mapped = rows
        .filter(r => r.linkme_commissions !== null)
        .map(r => r.linkme_commissions as CommissionRow)
        .sort((a, b) => {
          const da = a.order_date ?? '';
          const db = b.order_date ?? '';
          return da.localeCompare(db);
        });

      setCommissions(mapped);
    } catch (err) {
      console.error('[PaymentRequestDetail] fetch error:', err);
      setError('Impossible de charger les détails de cette demande.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData().catch(err => {
      console.error('[PaymentRequestDetail] fetchData error:', err);
    });
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error ?? !request) {
    return (
      <div className="p-6">
        <Link
          href="/canaux-vente/linkme/demandes-paiement"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <Card className="p-12 text-center">
          <p className="text-red-600">{error ?? 'Demande introuvable.'}</p>
        </Card>
      </div>
    );
  }

  const totalPayoutHT = commissions.reduce((s, c) => s + c.total_payout_ht, 0);
  const totalPayoutTTC = commissions.reduce(
    (s, c) => s + c.total_payout_ttc,
    0
  );

  // On peut enregistrer un paiement dès qu'une demande existe — même sans facture
  // déposée (cas régularisation : la facture peut déjà exister côté Qonto).
  const canProcess =
    request.status === 'pending' ||
    request.status === 'invoice_received' ||
    request.status === 'partially_paid';

  const remainingTTC = Math.max(0, request.total_amount_ttc - alreadyPaidTTC);

  // Build a PaymentRequestAdmin-compatible object for ProcessPaymentModal
  const requestForModal = {
    id: request.id,
    requestNumber: request.request_number,
    affiliateId: '',
    affiliateName: request.affiliate_name,
    affiliateEmail: request.affiliate_email,
    totalAmountHT: request.total_amount_ht,
    totalAmountTTC: request.total_amount_ttc,
    status: request.status,
    invoiceFileUrl: null,
    invoiceFileName: null,
    invoiceReceivedAt: null,
    paidAt: request.paid_at,
    paymentReference: request.payment_reference,
    createdAt: request.created_at,
    alreadyPaidTTC,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Retour */}
      <Link
        href="/canaux-vente/linkme/demandes-paiement"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux demandes
      </Link>

      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {request.request_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Créée le {formatDate(request.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={request.status} />

          {canProcess && (
            <button
              onClick={() => setShowProcessModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Banknote className="h-4 w-4" />
              Traiter le paiement
            </button>
          )}

          {(request.status === 'pending' ||
            request.status === 'invoice_received') && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Annuler cette demande ? Les commissions seront remises en "à payer".'
                  )
                ) {
                  void cancelRequest(request.id)
                    .then(() => {
                      void fetchData().catch(err =>
                        console.error(
                          '[PaymentRequestDetail] fetchData error:',
                          err
                        )
                      );
                    })
                    .catch(err =>
                      console.error('[PaymentRequestDetail] cancel error:', err)
                    );
                }
              }}
              disabled={isCancelling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Annuler la demande
            </button>
          )}
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Affilié</p>
            <p className="text-sm font-medium text-gray-900">
              {request.affiliate_name}
            </p>
            {request.affiliate_email && (
              <p className="text-xs text-gray-400">{request.affiliate_email}</p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Montant total TTC</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(request.total_amount_ttc)}
            </p>
            <p className="text-xs text-gray-400">
              HT : {formatCurrency(request.total_amount_ht)}
            </p>
          </div>
        </Card>

        {request.paid_at && (
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Payée le</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(request.paid_at)}
              </p>
              {request.payment_reference && (
                <p className="text-xs text-gray-400 truncate max-w-[160px]">
                  {request.payment_reference}
                </p>
              )}
            </div>
          </Card>
        )}

        {request.status === 'partially_paid' && (
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Banknote className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Restant dû</p>
              <p className="text-sm font-semibold text-amber-600">
                {formatCurrency(remainingTTC)}
              </p>
              <p className="text-xs text-gray-400">
                Versé : {formatCurrency(alreadyPaidTTC)}
              </p>
            </div>
          </Card>
        )}

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Commandes incluses</p>
            <p className="text-sm font-semibold text-gray-900">
              {commissions.length} commande{commissions.length > 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Note */}
      {request.notes && (
        <Card className="p-4 border-l-4 border-blue-400 bg-blue-50">
          <p className="text-sm text-blue-800">{request.notes}</p>
        </Card>
      )}

      {/* Tableau des commissions */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Commandes incluses ({commissions.length})
          </h2>
          <span className="text-xs text-gray-500">
            Total : {formatCurrency(totalPayoutTTC)} TTC
          </span>
        </div>

        {commissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Aucune commande liée à cette demande.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    N° commande
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">
                    Montant HT
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Rémunération HT
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Rémunération TTC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.map((c, idx) => (
                  <tr
                    key={`${c.order_number}-${idx}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-900">
                        {c.order_number}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 hidden lg:table-cell">
                      {formatDate(c.order_date)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 text-right hidden xl:table-cell">
                      {formatCurrency(c.order_amount_ht)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right">
                      {formatCurrency(c.total_payout_ht)}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-emerald-600 text-right">
                      {formatCurrency(c.total_payout_ttc)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700"
                  >
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">
                    {formatCurrency(totalPayoutHT)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-emerald-700 text-right">
                    {formatCurrency(totalPayoutTTC)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Bloc paiements effectués */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-400" />
            Paiements effectués ({payments.length})
          </h2>
          {payments.length > 0 && (
            <span className="text-xs text-gray-500">
              Total versé : {formatCurrency(alreadyPaidTTC)} /{' '}
              {formatCurrency(request.total_amount_ttc)}
            </span>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 space-y-3">
            <p>Aucun paiement enregistré.</p>
            {canProcess && (
              <button
                onClick={() => setShowProcessModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Banknote className="h-4 w-4" />
                Traiter le paiement
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p => (
              <div
                key={p.id}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {p.payment_reference}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(p.payment_date)}
                    {p.notes && (
                      <span className="ml-2 text-gray-400">— {p.notes}</span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                  {formatCurrency(p.amount_ttc)}
                </span>
              </div>
            ))}
            {/* Pied récap */}
            <div className="px-4 py-3 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Total payé
              </span>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(alreadyPaidTTC)}
                </span>
                {request.status === 'partially_paid' && (
                  <p className="text-xs text-amber-600">
                    Reste : {formatCurrency(remainingTTC)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal paiement */}
      <ProcessPaymentModal
        isOpen={showProcessModal}
        request={requestForModal}
        alreadyPaidTTC={alreadyPaidTTC}
        onClose={() => setShowProcessModal(false)}
        onSuccess={() => {
          void fetchData().catch(err =>
            console.error('[PaymentRequestDetail] refetch after payment:', err)
          );
          setShowProcessModal(false);
        }}
      />
    </div>
  );
}
