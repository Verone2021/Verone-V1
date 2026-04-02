'use client';

/**
 * Livre des Recettes — Style Indy epure
 *
 * Pas de badge count, pas d'alerte info. Design epure.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useBankReconciliation,
  formatBankPaymentMethod,
  detectBankPaymentMethod,
  type BankTransaction,
} from '@verone/finance';
import { SupplierCellReadOnly } from '@verone/finance/components';
import {
  Card,
  CardContent,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import { TrendingUp, ArrowLeft, Info } from 'lucide-react';

// =====================================================================
// HELPERS
// =====================================================================

type TransactionWithExtras = BankTransaction & {
  vat_rate?: number;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getPaymentMethod(tx: BankTransaction): string {
  const detected = detectBankPaymentMethod(tx.label ?? '');
  if (detected) return formatBankPaymentMethod(detected);
  const opType = tx.operation_type;
  if (opType) {
    const typeMap: Record<string, string> = {
      income: 'Virement recu',
      transfer: 'Virement',
      card: 'Carte bancaire',
      direct_debit: 'Prelevement',
      check: 'Cheque',
      qonto_fee: 'Frais bancaires',
      recall: 'Rappel',
      swift_income: 'Virement international',
    };
    return typeMap[opType] ?? opType;
  }
  return '-';
}

// =====================================================================
// PAGE
// =====================================================================

export default function RecettesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, loading, error } = useBankReconciliation();

  const filteredCredits = useMemo(() => {
    if (selectedYear === 'all') return creditTransactions;
    return creditTransactions.filter(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      return date?.startsWith(selectedYear);
    });
  }, [creditTransactions, selectedYear]);

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/finance/documents"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Documents
            </Link>
            <span>/</span>
            <span className="text-black">Recettes</span>
          </div>
          <h1 className="text-2xl font-bold">Livre des recettes</h1>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les annees</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Exercice {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guide */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Le Livre des Recettes</strong> liste tous vos encaissements
          (ventes, virements recus) par ordre chronologique. Il montre le
          client, le numero de facture, le mode de paiement, et les montants
          HT/TVA/TTC. Ce document est obligatoire pour les societes au regime
          reel.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      ) : filteredCredits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Aucune recette pour cette periode</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-2">Date paiement</div>
            <div className="col-span-1">N facture</div>
            <div className="col-span-3">Client / Libelle</div>
            <div className="col-span-2">Mode paiement</div>
            <div className="col-span-1 text-right">HT</div>
            <div className="col-span-1 text-right">TVA</div>
            <div className="col-span-2 text-right">TTC</div>
          </div>
          <ScrollArea className="h-[500px]">
            {(filteredCredits as TransactionWithExtras[]).map(tx => {
              const vatRate = tx.vat_rate ?? 0;
              const ttc = Math.abs(tx.amount);
              const ht = Math.round((ttc / (1 + vatRate / 100)) * 100) / 100;
              const tva = ttc - ht;

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3 border-b hover:bg-gray-50 transition-colors items-center text-sm"
                >
                  <div className="col-span-2 text-muted-foreground">
                    {formatDate(tx.settled_at ?? tx.emitted_at)}
                  </div>
                  <div
                    className="col-span-1 text-xs text-muted-foreground"
                    title={tx.reference ?? undefined}
                  >
                    {tx.matched_document?.document_number ??
                      tx.reference ??
                      '-'}
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium truncate">
                      <SupplierCellReadOnly
                        counterpartyName={tx.counterparty_name}
                        label={tx.label}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.label}
                    </p>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {getPaymentMethod(tx)}
                  </div>
                  <div className="col-span-1 text-right">
                    <Money amount={ht} size="sm" />
                  </div>
                  <div className="col-span-1 text-right text-muted-foreground">
                    <Money amount={tva} size="sm" />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    <Money amount={ttc} size="sm" />
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
