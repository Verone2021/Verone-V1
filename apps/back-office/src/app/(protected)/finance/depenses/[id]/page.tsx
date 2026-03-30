/**
 * Page: Détail Dépense
 * Route: /finance/depenses/[id]
 * Description: Affichage détail + historique paiements + formulaire paiement
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';

import Link from 'next/link';

import type { FinancialDocument } from '@verone/finance';
import { ButtonUnified, IconButton, Skeleton } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { AlertCircle, ArrowLeft, Download, FileImage } from 'lucide-react';

import { ExpenseForm } from '@/components/forms/expense-form';

import { ExpenseAmounts } from './_components/ExpenseAmounts';
import { ExpenseDetailHeader } from './_components/ExpenseDetailHeader';
import { ExpenseInfoCards } from './_components/ExpenseInfoCards';
import { ExpensePayments } from './_components/ExpensePayments';

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
  const isCreateMode = params.id === 'create';

  const fetchDocument = useCallback(async () => {
    if (isCreateMode) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_documents')
        .select(
          '*, partner:organisations!partner_id(id, legal_name, trade_name, type)'
        )
        .eq('id', params.id)
        .single();
      if (error) throw error;
      setDocument(data as FinancialDocument);

      const { data: items, error: itemsError } = await supabase
        .from('financial_document_lines')
        .select('*')
        .eq('document_id', params.id)
        .order('sort_order', { ascending: true });
      if (!itemsError && items) setDocumentItems(items as DocumentItem[]);
    } catch (error) {
      console.error('[Depenses] fetchDocument error:', error);
    } finally {
      setLoading(false);
    }
  }, [isCreateMode, supabase, params.id]);

  useEffect(() => {
    void fetchDocument().catch(error => {
      console.error('[Depenses] fetchDocument failed:', error);
    });
  }, [fetchDocument]);

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    fetchDocument().catch(error => {
      console.error('[Depenses] fetchDocument (payment) failed:', error);
    });
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
      <ExpenseDetailHeader document={document} />
      <ExpenseInfoCards document={document} />

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

      <ExpenseAmounts
        document={document}
        documentItems={documentItems}
        remaining={remaining}
      />

      <ExpensePayments
        documentId={document.id}
        documentNumber={document.document_number}
        remainingAmount={remaining}
        isPaid={isPaid}
        showPaymentForm={showPaymentForm}
        onTogglePaymentForm={setShowPaymentForm}
        onPaymentSuccess={handlePaymentSuccess}
      />

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
