'use client';

import { useEffect, useState } from 'react';

import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import { useRotationReport } from '@verone/finance/hooks';
import { RotationReportPdf } from '@verone/finance/pdf-templates';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  AlertCircle,
  Download,
  FileText,
  Flame,
  Snowflake,
  Activity,
  TrendingDown,
} from 'lucide-react';

interface RotationReportViewProps {
  dateFrom: string;
  dateTo: string;
}

const FSN_CONFIG = {
  F: {
    label: 'Fast (rotation > 6/an)',
    color: 'bg-gray-900 text-white',
    icon: Flame,
    description: 'Produits sains qui tournent rapidement',
  },
  S: {
    label: 'Slow (1 à 6/an)',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: Activity,
    description: 'Tournent modérément — surveiller',
  },
  N: {
    label: 'Non-moving (< 1/an)',
    color: 'bg-red-100 text-red-900 border-red-300',
    icon: Snowflake,
    description: 'Capital dormant — action recommandée',
  },
} as const;

export function RotationReportView({
  dateFrom,
  dateTo,
}: RotationReportViewProps) {
  const { report, loading, error, generateReport } = useRotationReport({
    dateFrom,
    dateTo,
  });
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    void generateReport().catch(err => {
      console.error('[RotationReportView] generateReport failed:', err);
    });
  }, [generateReport]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const fmt = (n: number, decimals = 0) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });

  return (
    <div className="space-y-6">
      {/* Barre Export */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Exporter le rapport
            </p>
            <p className="text-xs text-gray-600">
              Période du{' '}
              {new Date(report.summary.period_from).toLocaleDateString('fr-FR')}{' '}
              au{' '}
              {new Date(report.summary.period_to).toLocaleDateString('fr-FR')} (
              {report.summary.period_days} j)
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowPdfPreview(true)}
          disabled={!report || loading}
          variant="outline"
          size="sm"
          className="h-9"
        >
          <FileText className="h-4 w-4 mr-2" />
          Voir PDF
        </Button>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Produits analysés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_products_analyzed}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              CA HT vendu (période)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {fmt(report.summary.total_cogs_period)} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Rotation moyenne (/ an)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.average_turnover_ratio.toFixed(1)}×
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1 text-red-700">
              <TrendingDown className="h-3 w-3" />
              Capital dormant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {fmt(report.summary.immobilized_in_non_moving)} €
            </p>
            <p className="text-xs text-red-700 mt-1">
              {report.summary.non_moving_count} produits Non-moving
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classification FSN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classification FSN</CardTitle>
          <CardDescription className="text-xs">
            Fast / Slow / Non-moving par fréquence de rotation annualisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.by_class.map(c => {
              const config = FSN_CONFIG[c.class];
              const Icon = config.icon;
              return (
                <div key={c.class} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${config.color} text-xs gap-1`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">{c.count}</p>
                  <p className="text-xs text-gray-600">{config.description}</p>
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Unités vendues</span>
                      <span className="font-medium">{fmt(c.units_sold)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">CA HT</span>
                      <span className="font-medium">{fmt(c.cogs)} €</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Immobilisé</span>
                      <span className="font-medium">
                        {fmt(c.immobilized)} €
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Fast Movers */}
      {report.fast_movers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-gray-900" />
              Top 20 — Produits à plus forte rotation
            </CardTitle>
            <CardDescription className="text-xs">
              Vos meilleurs vendeurs sur la période, classés par fréquence de
              rotation annualisée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold">
                      Produit
                    </TableHead>
                    <TableHead className="text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Stock
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Vendu pér.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Rotation / an
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.fast_movers.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <TableCell className="text-xs font-medium max-w-[260px] truncate">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {p.stock_real}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {p.units_sold_period}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-gray-900">
                        {p.turnover_ratio_annual.toFixed(1)}×
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Non-Movers (capital dormant) */}
      {report.non_movers.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-900">
              <Snowflake className="h-4 w-4 text-red-600" />
              Top 20 — Capital dormant (action recommandée)
            </CardTitle>
            <CardDescription className="text-xs">
              Ces produits n&apos;ont pas tourné ou très peu sur la période. Ils
              immobilisent du capital sans le faire fructifier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead className="text-xs font-semibold">
                      Produit
                    </TableHead>
                    <TableHead className="text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Stock
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Vendu pér.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Immobilisé
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.non_movers.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}
                    >
                      <TableCell className="text-xs font-medium max-w-[260px] truncate">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {p.stock_real}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {p.units_sold_period}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-red-900">
                        {fmt(p.immobilized_value)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<RotationReportPdf report={report} />}
          title="Rapport Rotation des Stocks"
          filename={`rapport-rotation-${report.summary.period_from}-${report.summary.period_to}.pdf`}
        />
      )}
    </div>
  );
}
