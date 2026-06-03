'use client';

import { useEffect, useState } from 'react';

import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import { useRuptureReport } from '@verone/finance/hooks';
import { RuptureReportPdf } from '@verone/finance/pdf-templates';
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
  AlertTriangle,
  Download,
  FileText,
  TrendingDown,
  XCircle,
} from 'lucide-react';

import type { ProductRupture, RuptureSeverity } from '@verone/finance/hooks';

interface RuptureReportViewProps {
  dateFrom: string;
  dateTo: string;
}

const SEVERITY_CONFIG = {
  rupture: {
    label: 'En rupture',
    badge: 'bg-red-900 text-white',
    text: 'text-red-900',
    border: 'border-red-300',
    bg: 'bg-red-50',
    icon: XCircle,
  },
  critical: {
    label: 'Critique',
    badge: 'bg-red-100 text-red-900 border-red-300',
    text: 'text-red-700',
    border: 'border-red-200',
    bg: 'bg-red-50',
    icon: AlertTriangle,
  },
  warning: {
    label: 'À surveiller',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: AlertCircle,
  },
} as const;

function formatDays(days: number): string {
  if (!isFinite(days)) return '∞';
  if (days <= 0) return '0 j';
  if (days > 999) return '> 999 j';
  return `${Math.round(days)} j`;
}

function ProductTable({
  products,
  severity,
}: {
  products: ProductRupture[];
  severity: RuptureSeverity;
}) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className={config.bg}>
            <TableHead className="text-xs font-semibold">Produit</TableHead>
            <TableHead className="text-xs font-semibold">SKU</TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Stock
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Min
            </TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Vélocité / j
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Jours restants
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              En cmd
            </TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Perte CA 30j
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p, index) => (
            <TableRow
              key={p.id}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <TableCell className="text-xs font-medium max-w-[260px] truncate">
                {p.name}
              </TableCell>
              <TableCell className="text-xs text-gray-600">{p.sku}</TableCell>
              <TableCell
                className={`text-xs text-center font-bold ${config.text}`}
              >
                {p.stock_real}
              </TableCell>
              <TableCell className="text-xs text-center">
                {p.min_stock}
              </TableCell>
              <TableCell className="text-xs text-right">
                {p.velocity_per_day > 0 ? p.velocity_per_day.toFixed(2) : '—'}
              </TableCell>
              <TableCell
                className={`text-xs text-center font-medium ${config.text}`}
              >
                {formatDays(p.days_until_stockout)}
              </TableCell>
              <TableCell className="text-xs text-center">
                {p.stock_forecasted_in > 0 ? `+${p.stock_forecasted_in}` : '—'}
              </TableCell>
              <TableCell
                className={`text-xs text-right font-bold ${config.text}`}
              >
                {p.estimated_revenue_loss_30d.toLocaleString('fr-FR', {
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RuptureReportView({
  dateFrom,
  dateTo,
}: RuptureReportViewProps) {
  const { report, loading, error, generateReport } = useRuptureReport({
    dateFrom,
    dateTo,
  });
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    void generateReport().catch(err => {
      console.error('[RuptureReportView] generateReport failed:', err);
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

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const allGood =
    report.in_rupture.length === 0 &&
    report.critical.length === 0 &&
    report.warning.length === 0;

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Exporter le rapport
            </p>
            <p className="text-xs text-gray-600">
              Vélocité calculée sur les 90 derniers jours
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-900 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-red-900">
              En rupture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {report.summary.rupture_count}
            </p>
            <p className="text-xs text-red-700 mt-1">Stock = 0</p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-red-700">
              Critique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {report.summary.critical_count}
            </p>
            <p className="text-xs text-red-700 mt-1">Stock ≤ min</p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-amber-700">
              À surveiller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">
              {report.summary.warning_count}
            </p>
            <p className="text-xs text-amber-700 mt-1">Stock ≤ point réappro</p>
          </CardContent>
        </Card>

        <Card className="border-red-900">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Perte CA estimée 30j
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {fmt(report.summary.total_estimated_loss_30d)} €
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Recovery en cmd : {fmt(report.summary.total_immobilized_recovery)}{' '}
              €
            </p>
          </CardContent>
        </Card>
      </div>

      {allGood && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-900">
              ✓ Aucune rupture ni stock critique. Bonne santé d&apos;inventaire.
            </p>
          </CardContent>
        </Card>
      )}

      {report.in_rupture.length > 0 && (
        <Card className="border-red-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-900">
              <XCircle className="h-4 w-4" />
              En rupture ({report.in_rupture.length})
              <Badge className={SEVERITY_CONFIG.rupture.badge}>
                Action immédiate
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Ces produits ne sont plus disponibles à la vente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTable products={report.in_rupture} severity="rupture" />
          </CardContent>
        </Card>
      )}

      {report.critical.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Critique — sous le seuil minimum ({report.critical.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Stock en dessous du minimum défini. Réapprovisionner rapidement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTable products={report.critical} severity="critical" />
          </CardContent>
        </Card>
      )}

      {report.warning.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />À surveiller — sous le point de
              réappro ({report.warning.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Préparer un réapprovisionnement préventif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTable products={report.warning} severity="warning" />
          </CardContent>
        </Card>
      )}

      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<RuptureReportPdf report={report} />}
          title="Rapport Ruptures de Stock"
          filename={`rapport-ruptures-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      )}
    </div>
  );
}
