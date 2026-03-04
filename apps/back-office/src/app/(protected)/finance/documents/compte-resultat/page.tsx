'use client';

/**
 * Compte de Resultat (P&L PCG)
 *
 * Extrait de l'ancien onglet "Compte de resultat" de /finance/livres.
 * Format Plan Comptable General — Classes 6 et 7.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { useBankReconciliation, type BankTransaction } from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import {
  Calculator,
  BookOpenCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TransactionWithExtras = BankTransaction & {
  category_pcg?: string;
  ignore_reason?: string;
};

// =====================================================================
// PAGE
// =====================================================================

export default function CompteResultatPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Structure PCG complete
  const pcgStructure = {
    produits: [
      { code: '70', label: 'Ventes de produits/services' },
      { code: '74', label: 'Subventions' },
      { code: '75', label: 'Autres produits de gestion' },
      { code: '76', label: 'Produits financiers' },
      { code: '77', label: 'Produits exceptionnels' },
    ],
    charges: [
      { code: '60', label: 'Achats (marchandises, matieres)' },
      { code: '61', label: 'Services exterieurs' },
      { code: '62', label: 'Autres services exterieurs' },
      { code: '63', label: 'Impots et taxes' },
      { code: '64', label: 'Charges de personnel' },
      { code: '65', label: 'Autres charges de gestion' },
      { code: '66', label: 'Charges financieres' },
      { code: '67', label: 'Charges exceptionnelles' },
      { code: '68', label: 'Dotations aux amortissements' },
      { code: '69', label: 'Impot sur les benefices' },
    ],
  };

  const produitsParClasse = useMemo(() => {
    const classes: Record<string, number> = {};
    pcgStructure.produits.forEach(p => (classes[p.code] = 0));

    creditTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const pcgCode = tx.category_pcg;
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (classes[classCode] !== undefined) {
          classes[classCode] += Math.abs(tx.amount);
        }
      }
    });

    return pcgStructure.produits
      .map(p => ({ ...p, total: classes[p.code] ?? 0 }))
      .filter(p => p.total > 0);
  }, [creditTransactions, selectedYear, pcgStructure.produits]);

  const chargesParClasse = useMemo(() => {
    const classes: Record<string, number> = {};
    pcgStructure.charges.forEach(c => (classes[c.code] = 0));

    (debitTransactions as TransactionWithExtras[]).forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const pcgCode =
        tx.category_pcg || tx.ignore_reason?.match(/PCG (\d+)/)?.[1];
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (classes[classCode] !== undefined) {
          classes[classCode] += Math.abs(tx.amount);
        }
      }
    });

    return pcgStructure.charges
      .map(c => ({ ...c, total: classes[c.code] ?? 0 }))
      .filter(c => c.total > 0);
  }, [debitTransactions, selectedYear, pcgStructure.charges]);

  const totalProduits = produitsParClasse.reduce((sum, p) => sum + p.total, 0);
  const totalCharges = chargesParClasse.reduce((sum, c) => sum + c.total, 0);
  const resultat = totalProduits - totalCharges;

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
            <span className="text-black">Compte de resultat</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" />
            Compte de Resultat
          </h1>
          <p className="text-muted-foreground">
            Format Plan Comptable General (PCG) - Classes 6 et 7
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les annees</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Compte de Resultat{' '}
              {selectedYear === 'all' ? '— Toutes les annees' : selectedYear}
            </CardTitle>
            <CardDescription>
              Format Plan Comptable General (PCG) - Classes 6 et 7
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* PRODUITS */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                PRODUITS (Classe 7)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {produitsParClasse.length === 0 ? (
                  <div className="px-4 py-4 text-muted-foreground text-center">
                    Aucun produit enregistre
                  </div>
                ) : (
                  produitsParClasse.map(produit => (
                    <div
                      key={produit.code}
                      className="flex justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono bg-green-50 text-green-700"
                        >
                          {produit.code}
                        </Badge>
                        {produit.label}
                      </span>
                      <Money
                        amount={produit.total}
                        className="text-green-600 font-medium"
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-green-700 border-t-2 border-green-300 mt-2 bg-green-50 rounded">
                <span>TOTAL PRODUITS</span>
                <Money amount={totalProduits} />
              </div>
            </div>

            {/* CHARGES */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                CHARGES (Classe 6)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {chargesParClasse.length === 0 ? (
                  <div className="px-4 py-4 text-muted-foreground text-center">
                    Aucune charge categorisee
                  </div>
                ) : (
                  chargesParClasse.map(charge => (
                    <div
                      key={charge.code}
                      className="flex justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono bg-red-50 text-red-700"
                        >
                          {charge.code}
                        </Badge>
                        {charge.label}
                      </span>
                      <Money
                        amount={-charge.total}
                        className="text-red-600 font-medium"
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-red-700 border-t-2 border-red-300 mt-2 bg-red-50 rounded">
                <span>TOTAL CHARGES</span>
                <Money amount={-totalCharges} />
              </div>
            </div>

            {/* RESULTAT NET */}
            <div
              className={`p-6 rounded-lg ${resultat >= 0 ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xl font-bold">RESULTAT NET</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultat >= 0 ? 'Benefice' : 'Perte'} de l&apos;exercice{' '}
                    {selectedYear === 'all' ? '(toutes annees)' : selectedYear}
                  </p>
                </div>
                <Money
                  amount={resultat}
                  className={`text-3xl font-bold ${resultat >= 0 ? 'text-green-700' : 'text-red-700'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
