// =====================================================================
// Page: Détail Facture
// Date: 2025-10-11
// Description: Page détail facture avec historique paiements et actions
// =====================================================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PaymentForm } from '@/components/business/payment-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface InvoiceDetails {
  id: string;
  abby_invoice_number: string;
  abby_invoice_id: string;
  sales_order_id: string;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
  amount_paid: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

// =====================================================================
// METADATA
// =====================================================================

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Facture ${params.id} | Vérone Back Office`,
    description: 'Détail et historique de la facture',
  };
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Fetch facture
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .single();

  if (invoiceError || !invoice) {
    notFound();
  }

  const invoiceData = invoice as unknown as InvoiceDetails;

  // Fetch paiements
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', params.id)
    .order('payment_date', { ascending: false });

  const paymentsData = (payments || []) as unknown as Payment[];

  // Calculer montant restant
  const remainingAmount = invoiceData.total_ttc - (invoiceData.amount_paid || 0);

  // Status labels
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    partially_paid: 'Partiellement payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  };

  const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    draft: 'secondary',
    sent: 'default',
    paid: 'default',
    partially_paid: 'default',
    overdue: 'destructive',
    cancelled: 'secondary',
    refunded: 'secondary',
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
    cash: 'Espèces',
    card: 'Carte bancaire',
    other: 'Autre',
  };

  // Formater montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formater date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/factures" className="hover:text-foreground transition-colors">
          Factures
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{invoiceData.abby_invoice_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {invoiceData.abby_invoice_number}
            </h1>
            <Badge variant={STATUS_VARIANTS[invoiceData.status] || 'default'}>
              {STATUS_LABELS[invoiceData.status] || invoiceData.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Émise le {formatDate(invoiceData.issue_date)} • Échéance: {formatDate(invoiceData.due_date)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/factures">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <Button variant="outline" disabled>
            <FileText className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Détails facture */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche: Montants */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Montants */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total HT</p>
                  <p className="text-2xl font-bold">{formatAmount(invoiceData.total_ht)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">TVA</p>
                  <p className="text-2xl font-bold">{formatAmount(invoiceData.tva_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total TTC</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatAmount(invoiceData.total_ttc)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Statut paiement */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Montant payé</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatAmount(invoiceData.amount_paid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Montant restant dû</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {formatAmount(remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {invoiceData.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground">{invoiceData.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Historique paiements */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                {paymentsData.length} paiement{paymentsData.length > 1 ? 's' : ''} enregistré
                {paymentsData.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucun paiement enregistré</p>
                  <p className="text-sm text-muted-foreground">
                    Utilisez le formulaire ci-contre pour enregistrer un paiement
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsData.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(payment.payment_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.reference || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatAmount(payment.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Formulaire paiement */}
        <div className="lg:col-span-1">
          {remainingAmount > 0 ? (
            <PaymentForm
              invoiceId={invoiceData.id}
              invoiceNumber={invoiceData.abby_invoice_number}
              remainingAmount={remainingAmount}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold mb-2">Facture payée intégralement</p>
                <p className="text-sm text-muted-foreground">
                  Cette facture a été entièrement réglée
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
