'use client';

/**
 * Annexe Légale
 *
 * Notes explicatives aux comptes annuels.
 * Obligation SASU (Code de Commerce Art. L123-12 à L123-14).
 *
 * Contenu standard d'une annexe simplifiée :
 * - Règles et méthodes comptables
 * - Compléments d'information au bilan et au compte de résultat
 * - Informations sur les engagements financiers
 */

import { useState, useMemo } from 'react';

import {
  useBankReconciliation,
  TVA_RATES,
  calculateVAT,
  calculateHT,
  type BankTransaction,
} from '@verone/finance';
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
  Alert,
  AlertDescription,
  Button,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import {
  FileText,
  Calendar,
  Info,
  Building2,
  Scale,
  Download,
  Printer,
} from 'lucide-react';

// =====================================================================
// PAGE
// =====================================================================

export default function AnnexeLegalePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading } =
    useBankReconciliation();

  // Compute annual figures
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

    // TVA estimée
    const tvaCollectee = credits.reduce(
      (s, tx) => s + calculateVAT(Math.abs(tx.amount), 20),
      0
    );
    const tvaDeductible = debits.reduce(
      (s, tx) => s + calculateVAT(Math.abs(tx.amount), 20),
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

  const yearLabel = selectedYear === 'all' ? 'Toutes années' : selectedYear;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Annexe Légale
          </h1>
          <p className="text-muted-foreground">
            Notes explicatives aux comptes annuels — Exercice {yearLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          <strong>Document de travail.</strong> L&apos;annexe légale définitive
          doit être validée par votre expert-comptable avant dépôt au greffe du
          Tribunal de Commerce.
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                1. Identification de l&apos;entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Dénomination sociale :
                  </span>
                  <span className="font-medium ml-2">VERONE (à compléter)</span>
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
                    {process.env.NEXT_PUBLIC_VERONE_SIREN ?? '(à configurer)'}
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
                  <span className="text-muted-foreground">Activité :</span>
                  <span className="font-medium ml-2">
                    Commerce de décoration et mobilier d&apos;intérieur haut de
                    gamme
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Régime fiscal :</span>
                  <span className="font-medium ml-2">
                    IS — Impôt sur les sociétés
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Règles et méthodes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5" />
                2. Règles et méthodes comptables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">
                  2.1 Référentiel comptable
                </h4>
                <p className="text-muted-foreground">
                  Les comptes annuels sont établis conformément au Plan
                  Comptable Général (PCG, règlement ANC n°2014-03) et aux
                  dispositions du Code de Commerce (Art. L123-12 à L123-28).
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">
                  2.2 Conventions générales
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>
                    Principe de continuité d&apos;exploitation : les comptes
                    sont établis dans une perspective de poursuite
                    d&apos;activité
                  </li>
                  <li>
                    Principe de prudence : seuls les bénéfices réalisés sont
                    comptabilisés
                  </li>
                  <li>
                    Principe d&apos;indépendance des exercices : les produits et
                    charges sont rattachés à l&apos;exercice concerné
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2.3 TVA</h4>
                <p className="text-muted-foreground">
                  La société est assujettie à la TVA au régime réel normal. Les
                  taux appliqués sont :
                </p>
                <div className="flex gap-2 mt-2">
                  {TVA_RATES.map(rate => (
                    <Badge key={rate.value} variant="outline">
                      {rate.label} — {rate.description}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Compléments au compte de résultat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                3. Compléments au compte de résultat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium border-b">
                  <div>Rubrique</div>
                  <div className="text-right">Montant</div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">
                    Chiffre d&apos;affaires net (produits)
                  </div>
                  <div className="text-right">
                    <Money
                      amount={figures.totalRecettes}
                      className="text-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">Total des charges</div>
                  <div className="text-right">
                    <Money
                      amount={figures.totalDepenses}
                      className="text-red-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b bg-muted/30 font-bold">
                  <div>
                    Résultat de l&apos;exercice (
                    {figures.resultat >= 0 ? 'bénéfice' : 'perte'})
                  </div>
                  <div className="text-right">
                    <Money amount={figures.resultat} colorize bold />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">TVA collectée</div>
                  <div className="text-right">
                    <Money amount={figures.tvaCollectee} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">TVA déductible</div>
                  <div className="text-right">
                    <Money amount={figures.tvaDeductible} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3">
                  <div className="text-sm font-medium">
                    TVA nette ({figures.tvaNette >= 0 ? 'à payer' : 'crédit'})
                  </div>
                  <div className="text-right">
                    <Money amount={figures.tvaNette} colorize />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Engagements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                4. Engagements hors bilan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                À compléter par l&apos;expert-comptable : engagements donnés et
                reçus (cautions, garanties, contrats de crédit-bail, engagements
                de retraite, etc.).
              </p>
            </CardContent>
          </Card>

          {/* Section 5: Événements postérieurs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                5. Événements postérieurs à la clôture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                À compléter : événements significatifs survenus entre la date de
                clôture et la date d&apos;établissement des comptes.
              </p>
            </CardContent>
          </Card>

          {/* Section 6: Informations complémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                6. Informations complémentaires
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
                    Système comptable :
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
                    Conservation des pièces :
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
