'use client';

import { useEffect, useMemo, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import {
  buildHistoriqueReportData,
  type HistoriqueReportData,
} from '@verone/finance/utils';
import { HistoriqueReportPdf } from '@verone/finance/pdf-templates';
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
  ArrowDownCircle,
  ArrowUpCircle,
  Settings2,
  FileText,
  Download,
  TrendingUp,
} from 'lucide-react';

import { useMovementsHistory } from '../../hooks/use-movements-history';

interface HistoriqueReportViewProps {
  dateFrom?: string;
  dateTo?: string;
}

export function HistoriqueReportView({
  dateFrom,
  dateTo,
}: HistoriqueReportViewProps) {
  const { movements, stats, loading, applyFilters, filters } =
    useMovementsHistory();
  const { toast } = useToast();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Appliquer filtres de date si fournis
  useEffect(() => {
    if (dateFrom && dateTo) {
      applyFilters({
        ...filters,
        dateRange: {
          from: new Date(dateFrom),
          to: new Date(dateTo),
        },
        limit: 100,
      });
    }
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Construire les donnees du rapport
  const report: HistoriqueReportData | null = useMemo(() => {
    if (!stats) return null;
    return buildHistoriqueReportData(movements, stats);
  }, [movements, stats]);

  const handleExportPDF = () => {
    if (!report) return;
    setShowPdfPreview(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            <ArrowDownCircle className="h-3 w-3 mr-1" />
            IN
          </Badge>
        );
      case 'OUT':
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            OUT
          </Badge>
        );
      case 'ADJUST':
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            <Settings2 className="h-3 w-3 mr-1" />
            ADJUST
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'actions Export */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Exporter le rapport
            </p>
            <p className="text-xs text-gray-600">
              Telecharger dans le format de votre choix
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={!report || loading}
          variant="outline"
          size="sm"
          className="h-9"
        >
          <FileText className="h-4 w-4 mr-2" />
          {loading ? 'Chargement...' : 'Voir PDF'}
        </Button>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total mouvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_movements}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-green-600" />
              Entrees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {report.summary.total_in}
            </p>
            <p className="text-xs text-gray-500 mt-1">Mouvements IN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3 text-red-600" />
              Sorties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {report.summary.total_out}
            </p>
            <p className="text-xs text-gray-500 mt-1">Mouvements OUT</p>
          </CardContent>
        </Card>

        <Card className={report.summary.net_change < 0 ? 'border-red-200' : ''}>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Variation nette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                report.summary.net_change >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {report.summary.net_change > 0 ? '+' : ''}
              {report.summary.net_change}
            </p>
            <p className="text-xs text-gray-500 mt-1">Unites</p>
          </CardContent>
        </Card>
      </div>

      {/* Repartition par type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repartition par type</CardTitle>
          <CardDescription className="text-xs">
            Proportion des mouvements IN / OUT / ADJUST
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.by_type.map(t => {
              const maxCount = Math.max(...report.by_type.map(x => x.count));
              const colors: Record<string, string> = {
                'Entrees (IN)': 'bg-green-200',
                'Sorties (OUT)': 'bg-red-200',
                'Ajustements (ADJUST)': 'bg-blue-200',
              };
              return (
                <div key={t.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{t.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {t.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`${colors[t.type] || 'bg-gray-200'} h-full transition-all`}
                      style={{
                        width: `${maxCount > 0 ? (t.count / maxCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top motifs */}
      {report.top_reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top motifs</CardTitle>
            <CardDescription className="text-xs">
              Motifs les plus frequents ce mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.top_reasons.map((reason, index) => (
                <div
                  key={reason.code}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{reason.description}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {reason.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table mouvements detailles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers mouvements</CardTitle>
          <CardDescription className="text-xs">
            {movements.length} mouvements affiches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Produit
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Qte
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Avant
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Apres
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 50).map((movement, index) => (
                  <TableRow
                    key={movement.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell className="text-xs text-gray-600">
                      {new Date(movement.performed_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-[180px] truncate">
                      {movement.product_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getMovementTypeBadge(movement.movement_type)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-semibold">
                      {movement.movement_type === 'OUT' ? '-' : '+'}
                      {movement.quantity_change}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {movement.quantity_before}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {movement.quantity_after}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[150px] truncate">
                      {movement.reason_description || movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 text-center">
        Rapport genere le{' '}
        {new Date(report.generated_at).toLocaleString('fr-FR')}
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<HistoriqueReportPdf report={report} />}
          title="Rapport Historique Mouvements"
          filename={`rapport-historique-mouvements-${new Date().toISOString().split('T')[0]}.pdf`}
        />
      )}
    </div>
  );
}
