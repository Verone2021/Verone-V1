'use client';

import { useEffect, useState } from 'react';

import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import { useNiveauxReport } from '@verone/finance/hooks';
import { NiveauxReportPdf } from '@verone/finance/pdf-templates';
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
  BarChart3,
  Download,
  FileText,
  Snowflake,
} from 'lucide-react';

import type { ProductLevel, StockLevel } from '@verone/finance/hooks';

interface NiveauxReportViewProps {
  dateFrom: string;
  dateTo: string;
}

const LEVEL_CONFIG = {
  critical: {
    label: 'Critique (≤ min)',
    badge: 'bg-red-100 text-red-900 border-red-300',
    text: 'text-red-900',
    icon: AlertTriangle,
  },
  warning: {
    label: 'À surveiller (≤ réappro)',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    text: 'text-amber-900',
    icon: AlertCircle,
  },
  healthy: {
    label: 'Sain',
    badge: 'bg-gray-900 text-white',
    text: 'text-gray-900',
    icon: BarChart3,
  },
  overstock: {
    label: 'Surstock (> 180j)',
    badge: 'bg-gray-200 text-gray-700 border-gray-300',
    text: 'text-gray-700',
    icon: Snowflake,
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
  level,
}: {
  products: ProductLevel[];
  level: StockLevel;
}) {
  const config = LEVEL_CONFIG[level];
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">Produit</TableHead>
            <TableHead className="text-xs font-semibold">SKU</TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Stock
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Min
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Réappro
            </TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Véloc / j
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Couverture
            </TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Immobilisé
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
              <TableCell className="text-xs text-center">
                {p.reorder_point}
              </TableCell>
              <TableCell className="text-xs text-right">
                {p.velocity_per_day > 0 ? p.velocity_per_day.toFixed(2) : '—'}
              </TableCell>
              <TableCell
                className={`text-xs text-center font-medium ${config.text}`}
              >
                {formatDays(p.days_of_coverage)}
              </TableCell>
              <TableCell className="text-xs text-right font-medium">
                {p.immobilized_value.toLocaleString('fr-FR', {
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

export function NiveauxReportView({
  dateFrom,
  dateTo,
}: NiveauxReportViewProps) {
  const { report, loading, error, generateReport } = useNiveauxReport({
    dateFrom,
    dateTo,
  });
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    void generateReport().catch(err => {
      console.error('[NiveauxReportView] generateReport failed:', err);
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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Produits analysés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_products}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-red-900">
              Critique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {report.summary.critical_count}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-amber-900">
              À surveiller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-900">
              {report.summary.warning_count}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Couverture moyenne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDays(report.summary.avg_days_of_coverage)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Immobilisé : {fmt(report.summary.total_immobilized)} €
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classification résumée */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des niveaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['critical', 'warning', 'healthy', 'overstock'] as const).map(
              level => {
                const config = LEVEL_CONFIG[level];
                const Icon = config.icon;
                const count = report.summary[`${level}_count`];
                return (
                  <div
                    key={level}
                    className="border rounded-lg p-4 text-center space-y-2"
                  >
                    <Badge className={`${config.badge} text-xs gap-1`}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    <p className={`text-3xl font-bold ${config.text}`}>
                      {count}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {report.critical.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-4 w-4" />
              Critique — Action immédiate ({report.critical.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductTable
              products={report.critical.slice(0, 25)}
              level="critical"
            />
          </CardContent>
        </Card>
      )}

      {report.warning.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-4 w-4" />À surveiller — préparer un
              réappro ({report.warning.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductTable
              products={report.warning.slice(0, 30)}
              level="warning"
            />
          </CardContent>
        </Card>
      )}

      {report.overstock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <Snowflake className="h-4 w-4" />
              Surstock — plus de 180 jours de couverture (
              {report.overstock.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Capital immobilisé sur des produits qui tournent lentement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTable products={report.overstock} level="overstock" />
          </CardContent>
        </Card>
      )}

      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<NiveauxReportPdf report={report} />}
          title="Rapport Niveaux de Stock"
          filename={`rapport-niveaux-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      )}
    </div>
  );
}
