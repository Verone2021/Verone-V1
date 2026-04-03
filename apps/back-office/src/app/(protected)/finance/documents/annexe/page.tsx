'use client';

/**
 * Annexe Legale — Style Indy epure
 *
 * Notes explicatives aux comptes annuels.
 * Design epure sans badges excessifs.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useBankReconciliation,
  TVA_RATES,
  calculateVAT,
  type BankTransaction,
} from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Button,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import { Printer, ArrowLeft, Info } from 'lucide-react';

// =====================================================================
// PAGE
// =====================================================================

export default function AnnexeLegalePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading } =
    useBankReconciliation();

  const figures = useMemo(() => {
    const filterByYear = (txs: BankTransaction[]) =>
      selectedYear === 'all'
        ? txs
        : txs.filter(tx => {
            const date = tx.settled_at ?? tx.emitted_at;
            return date?.startsWith(selectedYear);
          });

    const credits = filterByYear(creditTransactions);
    const debits = filterByYear(debitTransactions);

    const totalRecettes = credits.reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const totalDepenses = debits.reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const resultat = totalRecettes - totalDepenses;

    const tvaCollectee = credits.reduce(
      (s, tx) =>
        s +
        calculateVAT(
          Math.abs(tx.amount),
          ((tx as BankTransaction & { vat_rate?: number }).vat_rate ?? 0) as
            | 0
            | 5.5
            | 10
            | 20
        ),
      0
    );
    const tvaDeductible = debits.reduce(
      (s, tx) =>
        s +
        calculateVAT(
          Math.abs(tx.amount),
          ((tx as BankTransaction & { vat_rate?: number }).vat_rate ?? 0) as
            | 0
            | 5.5
            | 10
            | 20
        ),
      0
    );

    return {
      totalRecettes,
      totalDepenses,
      resultat,
      tvaCollectee,
      tvaDeductible,
      tvaNette: tvaCollectee - tvaDeductible,
      nbTransactions: credits.length + debits.length,
    };
  }, [creditTransactions, debitTransactions, selectedYear]);

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  const yearLabel = selectedYear === 'all' ? 'Toutes annees' : selectedYear;

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
            <span className="text-black">Annexe legale</span>
          </div>
          <h1 className="text-2xl font-bold">Annexe Legale</h1>
          <p className="text-muted-foreground text-sm">Exercice {yearLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2 rounded-lg"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
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
      </div>

      {/* Guide */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>L&apos;Annexe Legale</strong> accompagne le Bilan et le Compte
          de Resultat. Elle explique les methodes comptables utilisees (comment
          vous calculez les amortissements, valorisez le stock, etc.), les
          engagements hors bilan, et la ventilation de la TVA. Elle est
          obligatoire au depot au Greffe chaque annee.
        </AlertDescription>
      </Alert>

      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          <strong>Document de travail.</strong> L&apos;annexe legale definitive
          doit etre validee par votre comptable avant depot au greffe.
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
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* Section 1: Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                1. Identification de l&apos;entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Denomination sociale :
                  </span>
                  <span className="font-medium ml-2">VERONE (a completer)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Forme juridique :
                  </span>
                  <span className="font-medium ml-2">SASU</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SIREN :</span>
                  <span className="font-medium ml-2">
                    {process.env.NEXT_PUBLIC_VERONE_SIREN ?? '(a configurer)'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Exercice comptable :
                  </span>
                  <span className="font-medium ml-2">
                    01/01/{yearLabel} au 31/12/{yearLabel}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Activite :</span>
                  <span className="font-medium ml-2">
                    Commerce de detail de decoration et mobilier
                    d&apos;interieur — sourcing creatif
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Regime fiscal :</span>
                  <span className="font-medium ml-2">
                    IS — Impot sur les societes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Regles et methodes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                2. Regles et methodes comptables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">
                  2.1 Referentiel comptable
                </h4>
                <p className="text-muted-foreground">
                  Les comptes annuels sont etablis conformement au Plan
                  Comptable General (PCG, reglement ANC n°2014-03) et aux
                  dispositions du Code de Commerce (Art. L123-12 a L123-28).
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">
                  2.2 Conventions generales
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Principe de continuite d&apos;exploitation</li>
                  <li>Principe de prudence</li>
                  <li>Principe d&apos;independance des exercices</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2.3 TVA</h4>
                <p className="text-muted-foreground">
                  Regime reel normal. Taux appliques :{' '}
                  {TVA_RATES.map(r => r.label).join(', ')}.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Complements au compte de resultat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                3. Complements au compte de resultat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 bg-gray-50 text-xs font-medium border-b">
                  <div>Rubrique</div>
                  <div className="text-right">Montant</div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b text-sm">
                  <div>Chiffre d&apos;affaires net</div>
                  <div className="text-right">
                    <Money amount={figures.totalRecettes} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b text-sm">
                  <div>Total des charges</div>
                  <div className="text-right">
                    <Money amount={figures.totalDepenses} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b text-sm font-semibold bg-gray-50/50">
                  <div>
                    Resultat de l&apos;exercice (
                    {figures.resultat >= 0 ? 'benefice' : 'perte'})
                  </div>
                  <div className="text-right">
                    <Money amount={figures.resultat} colorize bold size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b text-sm">
                  <div>TVA collectee</div>
                  <div className="text-right">
                    <Money amount={figures.tvaCollectee} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b text-sm">
                  <div>TVA deductible</div>
                  <div className="text-right">
                    <Money amount={figures.tvaDeductible} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm font-medium">
                  <div>
                    TVA nette ({figures.tvaNette >= 0 ? 'a payer' : 'credit'})
                  </div>
                  <div className="text-right">
                    <Money amount={figures.tvaNette} colorize size="sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                4. Engagements hors bilan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                A completer par l&apos;expert-comptable : engagements donnes et
                recus.
              </p>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                5. Evenements posterieurs a la cloture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                A completer : evenements significatifs survenus entre la date de
                cloture et la date d&apos;etablissement des comptes.
              </p>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                6. Informations complementaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">
                    Nombre de transactions :
                  </span>
                  <span className="font-medium ml-2">
                    {figures.nbTransactions}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Systeme comptable :
                  </span>
                  <span className="font-medium ml-2">
                    Verone Back Office + Qonto
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Banque principale :
                  </span>
                  <span className="font-medium ml-2">Qonto</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Conservation des pieces :
                  </span>
                  <span className="font-medium ml-2">
                    Qonto + Supabase Storage (10 ans)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
