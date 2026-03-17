'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@verone/common/hooks';
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
  Package,
  TrendingUp,
  Clock,
  Euro,
  FileText,
  Download,
} from 'lucide-react';

import { useAgingReport, AGING_BUCKETS } from '../../hooks/use-aging-report';
import { AgingReportPdf } from '../../pdf-templates/AgingReportPdf';
import { PdfPreviewModalDynamic as PdfPreviewModal } from '../PdfPreviewModalDynamic';

interface AgingReportViewProps {
  dateFrom?: string;
  dateTo?: string;
}

export function AgingReportView({ dateFrom, dateTo }: AgingReportViewProps) {
  const { report, loading, error, generateReport } = useAgingReport();
  const { toast: _toast } = useToast();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    void generateReport(dateFrom, dateTo);
  }, [dateFrom, dateTo, generateReport]);

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

  if (!report) {
    return null;
  }

  // Calcul pour l'histogramme (valeur max pour scaling)
  const maxValue = Math.max(...report.buckets.map(b => b.value));

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
            <p className="text-xs text-gray-600">Telecharger au format PDF</p>
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
          {loading ? 'Chargement...' : 'PDF'}
        </Button>
      </div>

      {/* Metriques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Package className="h-3 w-3" />
              Produits analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_products}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {report.summary.total_quantity.toLocaleString('fr-FR')} unites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Euro className="h-3 w-3" />
              Valeur totale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_value.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              EUR
            </p>
            <p className="text-xs text-gray-500 mt-1">Stock total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Age moyen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.average_age_days}j
            </p>
            <p className="text-xs text-gray-500 mt-1">Moyenne inventaire</p>
          </CardContent>
        </Card>

        <Card
          className={
            report.summary.percent_over_90_days > 30 ? 'border-red-200' : ''
          }
        >
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Stock vieilli
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.percent_over_90_days}%
            </p>
            <p className="text-xs text-red-600 mt-1">
              {report.summary.immobilized_value.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              EUR immobilises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histogramme par tranches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution par age</CardTitle>
          <CardDescription className="text-xs">
            Repartition de la valeur du stock par tranches temporelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.buckets.map(bucket => (
              <div key={bucket.bucket_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">
                    {bucket.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {bucket.count} produits
                    </span>
                    <span className="font-semibold">
                      {bucket.value.toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      EUR
                    </span>
                    <Badge
                      variant="outline"
                      className={`${bucket.color} text-xs`}
                    >
                      {bucket.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`${bucket.color} h-full flex items-center justify-end pr-2 transition-all`}
                    style={{
                      width: `${maxValue > 0 ? (bucket.value / maxValue) * 100 : 0}%`,
                    }}
                  >
                    {bucket.value > 0 && (
                      <span className="text-xs font-semibold text-gray-700">
                        {bucket.quantity.toLocaleString('fr-FR')} u.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 20 produits les plus anciens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top 20 - Produits les plus anciens
          </CardTitle>
          <CardDescription className="text-xs">
            Produits necessitant une attention prioritaire
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
                    Age (jours)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Stock
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Valeur
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Tranche
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Dernier mvt
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.top_oldest.map((product, index) => {
                  const bucket = AGING_BUCKETS.find(
                    b => b.id === product.bucket
                  );
                  return (
                    <TableRow
                      key={product.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {product.age_days}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {product.stock_quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium">
                        {product.value.toLocaleString('fr-FR', {
                          maximumFractionDigits: 0,
                        })}{' '}
                        EUR
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${bucket?.color} text-xs`}
                        >
                          {bucket?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {product.last_movement_date
                          ? new Date(
                              product.last_movement_date
                            ).toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Timestamp generation */}
      <div className="text-xs text-gray-500 text-center">
        Rapport genere le{' '}
        {new Date(report.generated_at).toLocaleString('fr-FR')}
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <PdfPreviewModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          document={<AgingReportPdf report={report} />}
          title="Rapport Aging Inventaire"
          filename={`rapport-aging-inventaire-${new Date().toISOString().split('T')[0]}.pdf`}
        />
      )}
    </div>
  );
}
