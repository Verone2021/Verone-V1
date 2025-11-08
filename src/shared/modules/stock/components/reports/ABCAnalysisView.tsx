'use client';

import { useEffect } from 'react';

import {
  AlertCircle,
  TrendingUp,
  BarChart3,
  Euro,
  FileText,
  Download,
  Package,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/shared/modules/common/hooks';
import {
  useABCAnalysis,
  ABC_CLASSES,
  type ABCReportData,
} from '@/shared/modules/finance/hooks';

interface ABCAnalysisViewProps {
  // Future : dateFrom, dateTo si on veut filtrer par période
}

export function ABCAnalysisView({}: ABCAnalysisViewProps) {
  const { report, loading, error, generateReport } = useABCAnalysis();
  const { toast } = useToast();

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleExportCSV = () => {
    if (!report) return;

    try {
      // Génération CSV basique (future amélioration avec lib)
      const csvData = [
        [
          'SKU',
          'Produit',
          'Stock',
          'Prix Coût',
          'Valeur',
          'Classe ABC',
          'Rang',
          '% Cumulé',
        ],
        ...report.products_by_class.A.map(p => [
          p.sku,
          p.name,
          p.stock_quantity,
          p.cost_price,
          p.value,
          'A',
          p.rank,
          p.cumulative_percentage.toFixed(2),
        ]),
        ...report.products_by_class.B.map(p => [
          p.sku,
          p.name,
          p.stock_quantity,
          p.cost_price,
          p.value,
          'B',
          p.rank,
          p.cumulative_percentage.toFixed(2),
        ]),
        ...report.products_by_class.C.map(p => [
          p.sku,
          p.name,
          p.stock_quantity,
          p.cost_price,
          p.value,
          'C',
          p.rank,
          p.cumulative_percentage.toFixed(2),
        ]),
      ];

      const csvContent = csvData.map(row => row.join(';')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `abc-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export CSV réussi',
        description: 'Le rapport ABC a été téléchargé au format CSV.',
      });
    } catch (error) {
      toast({
        title: 'Erreur export CSV',
        description: 'Impossible de générer le fichier CSV.',
        variant: 'destructive',
      });
    }
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
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analyse ABC - Classification Pareto
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Classification des produits par valeur selon la règle 80/15/5
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonV2 variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </ButtonV2>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1">
              <Package className="h-3 w-3" />
              Total Produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {report.summary.total_products}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {report.summary.total_quantity} unités en stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1">
              <Euro className="h-3 w-3" />
              Valeur Totale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {report.summary.total_value.toLocaleString('fr-FR', {
                maximumFractionDigits: 0,
              })}{' '}
              €
            </p>
            <p className="text-xs text-gray-600 mt-1">Valorisation complète</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1 text-green-800">
              <TrendingUp className="h-3 w-3" />
              Classe A (Critique)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-800">
              {report.summary.class_a_count}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {report.summary.class_a_value_percentage.toFixed(1)}% de la valeur
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1 text-blue-800">
              <BarChart3 className="h-3 w-3" />
              Classe B+C
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">
              {report.summary.class_b_count + report.summary.class_c_count}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {(
                report.summary.class_b_value_percentage +
                report.summary.class_c_value_percentage
              ).toFixed(1)}
              % de la valeur
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par Classe ABC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Répartition par Classe ABC
          </CardTitle>
          <CardDescription>
            Distribution selon la règle Pareto 80/15/5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.classes.map(classData => (
              <div
                key={classData.class_id}
                className={`${classData.color} border rounded-lg p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${classData.textColor} text-lg font-bold px-3 py-1`}
                    >
                      {classData.class_id}
                    </Badge>
                    <div>
                      <p className="font-bold text-sm">{classData.label}</p>
                      <p className="text-xs text-gray-600">
                        {classData.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {classData.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-600">Produits</p>
                    <p className="text-xl font-bold">{classData.count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Quantité</p>
                    <p className="text-xl font-bold">{classData.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Valeur</p>
                    <p className="text-xl font-bold">
                      {classData.value.toLocaleString('fr-FR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      €
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">% Valeur</p>
                    <p className="text-xl font-bold">
                      {classData.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={classData.textColor.replace('text', 'bg')}
                    style={{ width: `${classData.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 20 Haute Valeur (Classe A) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 20 Produits Haute Valeur (Focus Classe A)
          </CardTitle>
          <CardDescription>
            Produits critiques représentant la majorité de la valeur stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rang</TableHead>
                <TableHead className="w-16">Classe</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="text-right">% Cumulé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.top_20_high_value.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">
                    {product.rank}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ABC_CLASSES.find(c => c.id === product.abc_class)?.color
                      }
                    >
                      {product.abc_class}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock_quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.cost_price.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {product.value.toLocaleString('fr-FR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    €
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-xs">
                      {product.cumulative_percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Résumé Stratégique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-5 w-5" />
            Recommandations Stratégiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold text-green-800">
              Classe A ({report.summary.class_a_count} produits)
            </span>
            <span className="text-gray-700">
              → Monitoring quotidien, réapprovisionnement prioritaire, stock
              sécurité élevé
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-blue-800">
              Classe B ({report.summary.class_b_count} produits)
            </span>
            <span className="text-gray-700">
              → Suivi hebdomadaire, réappro standard, stock sécurité modéré
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-800">
              Classe C ({report.summary.class_c_count} produits)
            </span>
            <span className="text-gray-700">
              → Monitoring mensuel, commandes groupées possibles, stock minimal
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-gray-500 italic text-center py-2 border-t">
        Rapport généré le{' '}
        {new Date(report.generated_at).toLocaleString('fr-FR')} • Méthode Pareto
        ABC • Inspiré de Odoo, ERPNext, SAP
      </div>
    </div>
  );
}
