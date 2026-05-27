'use client';

import { useEffect, useState } from 'react';

import { PdfPreviewModalDynamic as PdfPreviewModal } from '@verone/finance/components';
import { useValorisationReport } from '@verone/finance/hooks';
import { ValorisationReportPdf } from '@verone/finance/pdf-templates';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input, Label } from '@verone/ui';
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
  Euro,
  FileText,
  Download,
  BarChart3,
  Calendar,
  RotateCcw,
} from 'lucide-react';

export function ValorisationReportView() {
  const { report, loading, error, generateReport } = useValorisationReport();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  // Snapshot date (vide = stock courant). Format yyyy-MM-dd pour input type=date.
  const [snapshotDate, setSnapshotDate] = useState<string>('');

  useEffect(() => {
    // Premier chargement : stock courant
    void generateReport(null).catch(err => {
      console.error('[ValorisationReportView] generateReport failed:', err);
    });
  }, [generateReport]);

  const handleApplySnapshot = () => {
    const snapshot = snapshotDate ? new Date(snapshotDate) : null;
    void generateReport(snapshot).catch(err => {
      console.error(
        '[ValorisationReportView] snapshot regenerate failed:',
        err
      );
    });
  };

  const handleResetSnapshot = () => {
    setSnapshotDate('');
    void generateReport(null).catch(err => {
      console.error('[ValorisationReportView] reset regenerate failed:', err);
    });
  };

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

  const maxCategoryValue = Math.max(...report.by_category.map(c => c.value));

  return (
    <div className="space-y-6">
      {/* Barre d'actions : snapshot date + export */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Snapshot date */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label
              htmlFor="snapshot-date"
              className="text-xs flex items-center gap-1 mb-1"
            >
              <Calendar className="h-3 w-3" />
              Snapshot stock à une date (usage comptable)
            </Label>
            <Input
              id="snapshot-date"
              type="date"
              value={snapshotDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setSnapshotDate(e.target.value)}
              className="h-9"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vide = stock courant. Sinon, reconstruit le stock à cette date via
              les mouvements postérieurs.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApplySnapshot}
              disabled={loading}
              variant="default"
              size="sm"
              className="h-9"
            >
              {loading ? 'Génération...' : 'Générer'}
            </Button>
            {report?.snapshot_at && (
              <Button
                onClick={handleResetSnapshot}
                disabled={loading}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Stock courant
              </Button>
            )}
          </div>
        </div>

        {/* Snapshot active info */}
        {report?.snapshot_at && (
          <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">
            <strong>Mode snapshot :</strong> Valorisation au{' '}
            {new Date(report.snapshot_at).toLocaleDateString('fr-FR')} (stock
            reconstruit historiquement).
          </div>
        )}

        {/* Export */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Exporter le rapport
              </p>
              <p className="text-xs text-gray-600">
                Télécharger en PDF (snapshot inclus si activé)
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
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Euro className="h-3 w-3" />
              Valeur totale (cout revient)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_value_cost_net.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              EUR
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cout de revient net moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Euro className="h-3 w-3" />
              Valeur (prix achat HT)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_value_cost_price.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              EUR
            </p>
            <p className="text-xs text-gray-500 mt-1">Prix d'achat HT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <Package className="h-3 w-3" />
              Nb produits en stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.total_products}
            </p>
            <p className="text-xs text-gray-500 mt-1">En stock actuellement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Cout moyen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {report.summary.average_unit_cost.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              EUR
            </p>
            <p className="text-xs text-gray-500 mt-1">Par produit</p>
          </CardContent>
        </Card>
      </div>

      {/* Repartition par categorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Repartition par categorie
          </CardTitle>
          <CardDescription className="text-xs">
            Valeur du stock par sous-categorie de produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.by_category.slice(0, 15).map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{cat.count} produits</span>
                    <span className="font-semibold">
                      {cat.value.toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      EUR
                    </span>
                    <Badge variant="outline" className="bg-blue-100 text-xs">
                      {cat.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-200 h-full flex items-center justify-end pr-2 transition-all"
                    style={{
                      width: `${maxCategoryValue > 0 ? (cat.value / maxCategoryValue) * 100 : 0}%`,
                    }}
                  >
                    {cat.value > 0 && (
                      <span className="text-xs font-semibold text-gray-700">
                        {cat.quantity.toLocaleString('fr-FR')} u.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 20 produits par valeur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top 20 - Produits par valeur
          </CardTitle>
          <CardDescription className="text-xs">
            Produits representant la plus grande valeur immobilisee
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
                    Cout unit.
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Valeur
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Categorie
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.top_20_by_value.map((product, index) => (
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
                    <TableCell className="text-xs text-right">
                      {product.stock_real}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {product.unit_cost.toLocaleString('fr-FR', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      EUR
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {product.value.toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      EUR
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {product.subcategory_name}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Distribution par tranche de valeur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Distribution par tranche de valeur
          </CardTitle>
          <CardDescription className="text-xs">
            Nombre de produits par tranche de valeur immobilisee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.value_distribution.map(range => (
              <div
                key={range.label}
                className="border rounded-lg p-3 text-center"
              >
                <p className="text-xs text-gray-600">{range.label}</p>
                <p className="text-lg font-bold mt-1">{range.count}</p>
                <p className="text-xs text-gray-500">
                  {range.value.toLocaleString('fr-FR', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  EUR
                </p>
              </div>
            ))}
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
          document={<ValorisationReportPdf report={report} />}
          title="Rapport Valorisation Stock"
          filename={`rapport-valorisation-stock-${new Date().toISOString().split('T')[0]}.pdf`}
        />
      )}
    </div>
  );
}
