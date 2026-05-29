'use client';

import { useEffect, useState } from 'react';

import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import { useFournisseursReport } from '@verone/finance/hooks';
import { FournisseursReportPdf } from '@verone/finance/pdf-templates';
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
  Award,
  Download,
  FileText,
  Star,
  ThumbsUp,
} from 'lucide-react';

import type { SupplierPerformance, SupplierLevel } from '@verone/finance/hooks';

interface FournisseursReportViewProps {
  dateFrom: string;
  dateTo: string;
}

const LEVEL_CONFIG = {
  excellent: {
    label: 'Excellent',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    text: 'text-emerald-900',
    icon: Award,
  },
  good: {
    label: 'Bon',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    text: 'text-blue-900',
    icon: ThumbsUp,
  },
  warning: {
    label: 'À surveiller',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    text: 'text-amber-900',
    icon: AlertCircle,
  },
  critical: {
    label: 'Critique',
    badge: 'bg-red-100 text-red-900 border-red-300',
    text: 'text-red-900',
    icon: AlertTriangle,
  },
  insufficient_data: {
    label: 'Données insuffisantes',
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    text: 'text-gray-700',
    icon: Star,
  },
} as const;

function formatPct(value: number): string {
  return `${value.toFixed(1)} %`;
}

function formatDelay(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return '0 j';
  return `${Math.round(days)} j`;
}

function SupplierTable({
  suppliers,
  level,
  showQualityIndex = true,
}: {
  suppliers: SupplierPerformance[];
  level: SupplierLevel;
  showQualityIndex?: boolean;
}) {
  const config = LEVEL_CONFIG[level];
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">Fournisseur</TableHead>
            <TableHead className="text-xs font-semibold">Segment</TableHead>
            <TableHead className="text-xs font-semibold text-center">
              PO
            </TableHead>
            <TableHead className="text-xs font-semibold text-right">
              Dépensé
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Délai moyen
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Conformité
            </TableHead>
            <TableHead className="text-xs font-semibold text-center">
              Manquant
            </TableHead>
            {showQualityIndex && (
              <TableHead className="text-xs font-semibold text-center">
                Quality Index
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s, index) => (
            <TableRow
              key={s.supplier_id}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <TableCell className="text-xs font-medium max-w-[220px] truncate">
                <div className="flex items-center gap-1.5">
                  {s.preferred_supplier && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                  <span className="truncate">{s.supplier_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-gray-600">
                {s.supplier_segment ?? '—'}
              </TableCell>
              <TableCell className="text-xs text-center">
                {s.po_count}
                {s.po_sample_count > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({s.po_sample_count}éch.)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-right font-medium">
                {s.total_spent_ttc.toLocaleString('fr-FR', {
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </TableCell>
              <TableCell
                className={`text-xs text-center font-medium ${config.text}`}
              >
                {formatDelay(s.avg_delay_days)}
              </TableCell>
              <TableCell className="text-xs text-center">
                {formatPct(s.conformity_rate)}
              </TableCell>
              <TableCell className="text-xs text-center">
                {formatPct(s.missing_qty_rate)}
              </TableCell>
              {showQualityIndex && (
                <TableCell
                  className={`text-xs text-center font-bold ${config.text}`}
                >
                  {s.quality_index.toFixed(0)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function FournisseursReportView({
  dateFrom,
  dateTo,
}: FournisseursReportViewProps) {
  const { report, loading, error, generateReport } = useFournisseursReport({
    dateFrom,
    dateTo,
  });
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    void generateReport().catch(err => {
      console.error('[FournisseursReportView] generateReport failed:', err);
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
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Exporter le rapport
            </p>
            <p className="text-xs text-gray-600">
              Quality Index = (Conformité + (100 − Manquant)) ÷ 2
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Fournisseurs analysés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_suppliers}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {report.summary.total_po} PO sur la période
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-300 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-emerald-900">
              Excellents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900">
              {report.summary.excellent_count}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs text-red-900">
              Critiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {report.summary.critical_count}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">
              Délai moyen global
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDelay(report.summary.avg_delay_global)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total dépensé : {fmt(report.summary.total_spent_ttc)} €
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des niveaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(
              [
                'excellent',
                'good',
                'warning',
                'critical',
                'insufficient_data',
              ] as const
            ).map(level => {
              const config = LEVEL_CONFIG[level];
              const Icon = config.icon;
              const count =
                level === 'insufficient_data'
                  ? report.summary.insufficient_count
                  : report.summary[`${level}_count`];
              return (
                <div
                  key={level}
                  className="border rounded-lg p-4 text-center space-y-2"
                >
                  <Badge className={`${config.badge} text-xs gap-1`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                  <p className={`text-3xl font-bold ${config.text}`}>{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {report.excellent.length > 0 && (
        <Card className="border-emerald-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-900">
              <Award className="h-4 w-4" />
              Excellents — fournisseurs fiables ({report.excellent.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Quality Index ≥ 85 et au moins 3 PO sur la période.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierTable suppliers={report.excellent} level="excellent" />
          </CardContent>
        </Card>
      )}

      {report.good.length > 0 && (
        <Card className="border-blue-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-900">
              <ThumbsUp className="h-4 w-4" />
              Bons ({report.good.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierTable suppliers={report.good} level="good" />
          </CardContent>
        </Card>
      )}

      {report.warning.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-4 w-4" />À surveiller (
              {report.warning.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Quality Index entre 40 et 64. À challenger sur délais et
              quantités.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierTable suppliers={report.warning} level="warning" />
          </CardContent>
        </Card>
      )}

      {report.critical.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-4 w-4" />
              Critiques — action requise ({report.critical.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Quality Index &lt; 40 ou délai moyen &gt; 30 jours. Envisager
              alternative.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierTable suppliers={report.critical} level="critical" />
          </CardContent>
        </Card>
      )}

      {report.insufficient_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <Star className="h-4 w-4" />
              Données insuffisantes ({report.insufficient_data.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Moins de 2 PO reçues sur la période — pas de scoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierTable
              suppliers={report.insufficient_data}
              level="insufficient_data"
              showQualityIndex={false}
            />
          </CardContent>
        </Card>
      )}

      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<FournisseursReportPdf report={report} />}
          title="Rapport Performance Fournisseurs"
          filename={`rapport-fournisseurs-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      )}
    </div>
  );
}
