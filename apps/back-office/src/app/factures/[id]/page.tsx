'use client';

import { useState, useEffect, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@verone/ui';
import { Money, StatusPill } from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Download,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface FinancialDocument {
  id: string;
  document_number: string;
  document_type: string;
  document_direction: string;
  document_date: string;
  due_date: string | null;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  amount_paid: number;
  status: string;
  description: string | null;
  notes: string | null;
  uploaded_file_url: string | null;
  qonto_attachment_id: string | null;
  created_at: string;
  updated_at: string;
  partner?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    type: string | null;
  } | null;
}

interface Payment {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string | null;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    customer_invoice: 'Facture client',
    customer_credit_note: 'Avoir client',
    supplier_invoice: 'Facture fournisseur',
    supplier_credit_note: 'Avoir fournisseur',
    expense: 'Dépense',
  };
  return labels[type] || type;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    virement: 'Virement bancaire',
    cb: 'Carte bancaire',
    cheque: 'Chèque',
    especes: 'Espèces',
    prelevement: 'Prélèvement',
  };
  return labels[method] || method;
}

// =====================================================================
// COMPOSANTS
// =====================================================================

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 text-sm text-slate-600">
        {formatDateShort(payment.payment_date)}
      </td>
      <td className="py-3 text-sm text-slate-900">
        {payment.payment_method
          ? getPaymentMethodLabel(payment.payment_method)
          : '-'}
      </td>
      <td className="py-3 text-sm text-slate-600">
        {payment.transaction_reference || '-'}
      </td>
      <td className="py-3 text-right">
        <span className="text-sm font-semibold text-green-600">
          <Money amount={payment.amount_paid} size="sm" colorize />
        </span>
      </td>
    </tr>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params with use()
  const { id } = use(params);

  const router = useRouter();
  const [document, setDocument] = useState<FinancialDocument | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch document data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch document
        const { data: docData, error: docError } = await supabase
          .from('financial_documents')
          .select(
            `
            *,
            partner:organisations!partner_id(id, legal_name, trade_name, type)
          `
          )
          .eq('id', id)
          .single();

        if (docError) {
          if (docError.code === 'PGRST116') {
            setError('Document non trouvé');
          } else {
            throw docError;
          }
          return;
        }

        setDocument(docData as FinancialDocument);

        // Fetch payments
        const { data: paymentsData } = await supabase
          .from('financial_payments')
          .select('*')
          .eq('document_id', id)
          .order('payment_date', { ascending: false });

        if (paymentsData) {
          setPayments(paymentsData as Payment[]);
        }
      } catch (err) {
        console.error('[InvoiceDetail] Error:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // Handle download
  const handleDownload = () => {
    if (document?.id) {
      window.open(`/api/documents/${document.id}/download`, '_blank');
    }
  };

  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Finance - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'Document non trouvé'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingAmount = document.total_ttc - document.amount_paid;
  const isOverdue =
    document.due_date &&
    new Date(document.due_date) < new Date() &&
    document.status !== 'paid';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/factures">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{document.document_number}</h1>
              <StatusPill status={document.status} size="md" />
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {getDocumentTypeLabel(document.document_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(document.uploaded_file_url || document.qonto_attachment_id) && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          )}
          {document.status !== 'paid' && (
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Enregistrer un paiement
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="Numéro">{document.document_number}</InfoRow>
                  <InfoRow label="Type">
                    {getDocumentTypeLabel(document.document_type)}
                  </InfoRow>
                  <InfoRow label="Date d'émission">
                    {formatDate(document.document_date)}
                  </InfoRow>
                  {document.due_date && (
                    <InfoRow label="Date d'échéance">
                      <span className={isOverdue ? 'text-red-600' : ''}>
                        {formatDate(document.due_date)}
                      </span>
                    </InfoRow>
                  )}
                </div>
                <div>
                  <InfoRow label="Montant HT">
                    <Money amount={document.total_ht} />
                  </InfoRow>
                  <InfoRow label="TVA">
                    <Money amount={document.tva_amount} />
                  </InfoRow>
                  <InfoRow label="Montant TTC">
                    <span className="font-bold">
                      <Money amount={document.total_ttc} />
                    </span>
                  </InfoRow>
                </div>
              </div>

              {document.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Description</p>
                    <p className="text-sm">{document.description}</p>
                  </div>
                </>
              )}

              {document.notes && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{document.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historique des paiements
              </CardTitle>
              <CardDescription>
                {payments.length > 0
                  ? `${payments.length} paiement(s) enregistré(s)`
                  : 'Aucun paiement enregistré'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Méthode</th>
                      <th className="pb-2 font-medium">Référence</th>
                      <th className="pb-2 font-medium text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <PaymentRow key={payment.id} payment={payment} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun paiement enregistré</p>
                  <p className="text-sm mt-1">
                    Cliquez sur "Enregistrer un paiement" pour ajouter un
                    paiement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total TTC</span>
                <span className="font-bold">
                  <Money amount={document.total_ttc} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Payé</span>
                <span className="text-green-600 font-medium">
                  <Money amount={document.amount_paid} colorize />
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Reste à payer</span>
                <span
                  className={`font-bold ${remainingAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}
                >
                  <Money amount={remainingAmount} />
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.min(100, (document.amount_paid / document.total_ttc) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {Math.round(
                    (document.amount_paid / document.total_ttc) * 100
                  )}
                  % payé
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Partner info */}
          {document.partner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {document.document_direction === 'inbound'
                    ? 'Client'
                    : 'Fournisseur'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{document.partner.legal_name}</p>
                  {document.partner.trade_name && (
                    <p className="text-sm text-slate-600">
                      {document.partner.trade_name}
                    </p>
                  )}
                  <Link
                    href={`/contacts-organisations/${document.partner.id}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Voir la fiche
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 space-y-1">
              <p>Créé le {formatDate(document.created_at)}</p>
              <p>Modifié le {formatDate(document.updated_at)}</p>
              <p className="font-mono text-[10px] text-slate-400 mt-2">
                ID: {document.id}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
