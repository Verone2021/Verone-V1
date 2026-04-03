'use client';

/**
 * Bilan — Style Indy (tableau formel Cerfa)
 *
 * BILAN ACTIF : Brut | Amortissements | Net N | Net N-1
 * BILAN PASSIF : Net N | Net N-1
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { useBankReconciliation, useFixedAssets } from '@verone/finance';
import { createClient } from '@verone/utils/supabase/client';
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { ArrowLeft, Info } from 'lucide-react';

import { BilanActifTable } from './_components/BilanActifTable';
import { BilanPassifTable } from './_components/BilanPassifTable';
import { useBilanData } from './_components/useBilanData';

export default function BilanPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Fetch stock value from products
  const [stockValue, setStockValue] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from('products')
      .select('stock_quantity, cost_price')
      .then(({ data }) => {
        if (data) {
          const total = (
            data as { stock_quantity: number; cost_price: number }[]
          ).reduce(
            (sum, p) =>
              sum +
              (p.stock_quantity > 0
                ? p.stock_quantity * (p.cost_price ?? 0)
                : 0),
            0
          );
          setStockValue(Math.round(total * 100) / 100);
        }
      });
  }, []);

  // Get fixed assets stats
  const { stats: faStats } = useFixedAssets();

  const bilan = useBilanData(
    creditTransactions,
    debitTransactions,
    selectedYear,
    currentYear,
    {
      stockValue,
      fixedAssetsBrut: faStats.totalBrut,
      fixedAssetsAmort: faStats.totalAmort,
    }
  );

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
            <span className="text-black">Bilan</span>
          </div>
          <h1 className="text-2xl font-bold">Bilan</h1>
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
          <strong>Le Bilan</strong> est la photo de votre entreprise a un
          instant T. A gauche : ce que vous possedez (<strong>Actif</strong> —
          immobilisations, stock, tresorerie). A droite : comment c&apos;est
          finance (<strong>Passif</strong> — capital, dettes, resultat).
          L&apos;actif doit toujours etre egal au passif. Il est obligatoire
          chaque annee pour le depot au Greffe.
        </AlertDescription>
      </Alert>

      {/* Alert exercice */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          Votre bilan {bilan.yearN} n&apos;est{' '}
          <strong>pas encore cloture</strong>, les montants affiches sont{' '}
          <strong>previsionnels</strong>.
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
      ) : (
        <div className="space-y-8">
          <BilanActifTable bilan={bilan} />
          <BilanPassifTable bilan={bilan} />
        </div>
      )}
    </div>
  );
}
