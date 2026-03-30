'use client';

/**
 * Bilan — Style Indy (tableau formel Cerfa)
 *
 * BILAN ACTIF : Brut | Amortissements | Net N | Net N-1
 * BILAN PASSIF : Net N | Net N-1
 */

import { useState } from 'react';

import Link from 'next/link';

import { useBankReconciliation } from '@verone/finance';
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

  const bilan = useBilanData(
    creditTransactions,
    debitTransactions,
    selectedYear,
    currentYear
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

      {/* Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          Votre bilan {bilan.yearN} n&apos;est{' '}
          <strong>pas encore cloture</strong>, les montants affiches sont{' '}
          <strong>previsionnels</strong>.
          <br />
          Rendez-vous dans l&apos;onglet <em>A faire</em> pour acceder a la
          cloture et <strong>generer votre bilan definitif</strong>.
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
