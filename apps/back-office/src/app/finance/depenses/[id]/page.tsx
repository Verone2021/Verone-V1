/**
 * Page: Détail Dépense
 * Route: /finance/depenses/[id]
 * Description: Affichage détail + historique paiements + formulaire paiement
 */

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';

import Link from 'next/link';

import { useFinancialPayments } from '@verone/finance';
import { FinancialPaymentForm } from '@verone/finance';
import type { FinancialDocument, DocumentStatus } from '@verone/finance';
import { Badge, ButtonUnified, IconButton } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Separator } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  FileText,
  Download,
  Euro,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Tag,
  FileImage,
} from 'lucide-react';

import { ExpenseForm } from '@/components/forms/expense-form';

// =====================================================================
// TYPES
// =====================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  sort_order: number;
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export default function ExpenseDetailPage(props: PageProps) {
  const params = use(props.params);
  const [document, setDocument] = useState<FinancialDocument | null>(null);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const supabase = createClient();

  // Ne pas initialiser le hook si c'est "create"
  const isCreateMode = params.id === 'create';
  const {
    payments,
    loading: paymentsLoading,
    refresh: refreshPayments,
  } = useFinancialPayments(isCreateMode ? '' : params.id);

  // Fetch document and items
  const fetchDocument = async () => {
    // Si mode création, on ne charge rien
    if (isCreateMode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch document avec partner
      const { data, error } = await supabase
        .from('financial_documents')
        .select(
          `
          *,
          partner:organisations!partner_id(id, legal_name, trade_name, type)
        `
        )
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setDocument(data as unknown as FinancialDocument);

      // Fetch items (lignes TVA)
      // Note: utilise financial_document_lines (table existante)
      const { data: items, error: itemsError } = await (supabase as any)
        .from('financial_document_lines')
        .select('*')
        .eq('document_id', params.id)
        .order('sort_order', { ascending: true });

      if (!itemsError && items) {
        setDocumentItems(items as DocumentItem[]);
      }
    } catch (error) {
      console.error('Fetch document error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  // Badge status helper
  const getStatusBadge = (status: DocumentStatus) => {
    const variants: Record<
      DocumentStatus,
      { variant: any; icon: any; label: string }
    > = {
      draft: { variant: 'secondary', icon: FileText, label: 'Brouillon' },
      sent: { variant: 'secondary', icon: FileText, label: 'Envoyée' },
      received: { variant: 'secondary', icon: CheckCircle2, label: 'Reçue' },
      paid: { variant: 'success', icon: CheckCircle2, label: 'Payée' },
      partially_paid: { variant: 'warning', icon: Clock, label: 'Partiel' },
      overdue: {
        variant: 'destructive',
        icon: AlertCircle,
        label: 'En retard',
      },
      cancelled: { variant: 'secondary', icon: FileText, label: 'Annulée' },
      refunded: { variant: 'secondary', icon: FileText, label: 'Remboursée' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    fetchDocument(); // Refresh document (amount_paid updated)
    refreshPayments(); // Refresh payments list
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Mode création - afficher formulaire de création
  if (isCreateMode) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/finance/depenses">
            <IconButton
              icon={ArrowLeft}
              variant="outline"
              size="sm"
              label="Retour à la liste des dépenses"
            />
          </Link>

          <div>
            <h1 className="text-3xl font-bold">Nouvelle Dépense</h1>
            <p className="text-gray-500 mt-1">
              Créer une nouvelle dépense opérationnelle
            </p>
          </div>
        </div>

        <ExpenseForm />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Dépense introuvable
        </h3>
        <Link href="/finance/depenses">
          <ButtonUnified variant="outline" icon={ArrowLeft} iconPosition="left">
            Retour à la liste
          </ButtonUnified>
        </Link>
      </div>
    );
  }

  const remaining = document.total_ttc - document.amount_paid;
  const isPaid = document.status === 'paid';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/depenses">
            <IconButton
              icon={ArrowLeft}
              variant="outline"
              size="sm"
              label="Retour à la liste des dépenses"
            />
          </Link>

          <div>
            <h1 className="text-3xl font-bold">{document.document_number}</h1>
            <p className="text-gray-500 mt-1">Dépense opérationnelle</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(document.status)}

          {document.uploaded_file_url && (
            <a
              href={document.uploaded_file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ButtonUnified
                variant="outline"
                icon={Download}
                iconPosition="left"
              >
                Télécharger justificatif
              </ButtonUnified>
            </a>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">
                  {/* Catégorie extraite de la description [PCG xxx] */}
                  {document.description?.match(/\[([^\]]+)\]/)?.[1] || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Fournisseur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <span className="font-medium">
                {document.partner
                  ? getOrganisationDisplayName(document.partner)
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Date dépense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="font-medium">
                {format(new Date(document.document_date), 'dd MMMM yyyy', {
                  locale: fr,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Date échéance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="font-medium">
                {document.due_date
                  ? format(new Date(document.due_date), 'dd MMMM yyyy', {
                      locale: fr,
                    })
                  : 'Non définie'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {document.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{document.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Montants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Montants</CardTitle>
            {documentItems.length > 1 && (
              <Badge variant="outline" className="text-blue-600">
                TVA ventilée ({documentItems.length} lignes)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lignes TVA détaillées (si multi-taux) */}
          {documentItems.length > 1 && (
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600 mb-3">
                Ventilation TVA
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.total_ht.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.tva_rate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.tva_amount.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.total_ttc.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totaux */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total HT</p>
              <p className="text-2xl font-bold">
                {document.total_ht.toFixed(2)} €
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">TVA</p>
              <p className="text-2xl font-bold">
                {document.tva_amount.toFixed(2)} €
              </p>
              {documentItems.length === 1 && documentItems[0]?.tva_rate && (
                <Badge variant="outline" className="mt-1">
                  {documentItems[0].tva_rate}%
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Total TTC</p>
              <p className="text-2xl font-bold">
                {document.total_ttc.toFixed(2)} €
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Montant payé</p>
              <p className="text-2xl font-bold text-green-600">
                {document.amount_paid.toFixed(2)} €
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Restant dû</p>
              <p
                className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}`}
              >
                {remaining.toFixed(2)} €
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique paiements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des paiements ({payments.length})</CardTitle>

            {!isPaid && remaining > 0 && !showPaymentForm && (
              <ButtonUnified
                variant="success"
                icon={CreditCard}
                iconPosition="left"
                onClick={() => setShowPaymentForm(true)}
              >
                Enregistrer un paiement
              </ButtonUnified>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showPaymentForm && (
            <>
              <FinancialPaymentForm
                documentId={document.id}
                documentNumber={document.document_number}
                remainingAmount={remaining}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
              />
              <Separator className="my-6" />
            </>
          )}

          {paymentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Aucun paiement enregistré pour cette dépense
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {payment.amount_paid.toFixed(2)} €
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {payment.transaction_reference || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {document.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">
              {document.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Justificatif */}
      {document.uploaded_file_url && (
        <Card>
          <CardHeader>
            <CardTitle>Justificatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileImage className="h-8 w-8 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Document justificatif</p>
                <p className="text-sm text-gray-500">
                  Facture ou reçu de la dépense
                </p>
              </div>
              <a
                href={document.uploaded_file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ButtonUnified
                  variant="outline"
                  icon={Download}
                  iconPosition="left"
                >
                  Télécharger
                </ButtonUnified>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
