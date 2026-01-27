'use client';

/**
 * 📊 Page Stock Analytics
 *
 * Phase 3.4 - Stock Analytics Module
 * Métriques avancées : Rotation, ADU, Couverture, ABC, XYZ
 *
 * @since 2025-11-02
 */

import * as React from 'react';
import { useEffect } from 'react';

import Image from 'next/image';

import { useStockAnalytics } from '@verone/stock';
import { ABC_CLASSES, XYZ_CLASSES } from '@verone/stock';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  TrendingUp,
  Package,
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock';

export default function StockAnalyticsPage() {
  const { report, loading, error, generateReport } = useStockAnalytics();

  // Générer le rapport au chargement de la page
  useEffect(() => {
    void generateReport(90).catch(error => {
      console.error('[StocksAnalyticsPage] generateReport failed:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Formate un nombre avec 2 décimales
   */
  const formatNumber = (num: number, decimals = 2): string => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  /**
   * Retourne la couleur du badge ABC
   */
  const getABCBadgeColor = (abcClass: 'A' | 'B' | 'C') => {
    const cls = ABC_CLASSES.find(c => c.id === abcClass);
    return cls ? cls.color : 'bg-gray-100';
  };

  /**
   * Retourne la couleur du badge XYZ
   */
  const getXYZBadgeColor = (xyzClass: 'X' | 'Y' | 'Z') => {
    const cls = XYZ_CLASSES.find(c => c.id === xyzClass);
    return cls ? cls.color : 'bg-gray-100';
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            Erreur lors du chargement des analytics
          </p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button
            onClick={() => {
              void generateReport(90).catch(error => {
                console.error(
                  '[StocksAnalyticsPage] generateReport failed:',
                  error
                );
              });
            }}
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chargement des analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    summary,
    products,
    abc_classes,
    xyz_classes,
    top_20_high_value,
    top_20_low_turnover,
  } = report;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Analytics</h1>
          <p className="text-gray-500 mt-1">
            Métriques avancées et classifications ABC/XYZ
          </p>
        </div>
        <Button
          onClick={() => {
            void generateReport(90).catch(error => {
              console.error(
                '[StocksAnalyticsPage] generateReport failed:',
                error
              );
            });
          }}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StockKPICard
          title="Total Produits"
          value={summary.total_products}
          icon={Package}
          variant="default"
          subtitle={`${summary.total_quantity.toLocaleString('fr-FR')} unités`}
        />

        <StockKPICard
          title="Valeur Stock"
          value={`${formatNumber(summary.total_value, 0)} €`}
          icon={TrendingUp}
          variant="success"
          subtitle="Inventaire total"
        />

        <StockKPICard
          title="ADU Moyen"
          value={formatNumber(summary.average_adu)}
          icon={Activity}
          variant="info"
          subtitle="Demande journalière moyenne"
        />

        <StockKPICard
          title="Couverture Moyenne"
          value={`${formatNumber(summary.average_coverage_days, 0)}j`}
          icon={Clock}
          variant={summary.average_coverage_days < 30 ? 'danger' : 'success'}
          subtitle="Jours de stock restants"
        />

        <StockKPICard
          title="Rotation Moyenne"
          value={`${formatNumber(summary.average_turnover_rate, 1)}%`}
          icon={RefreshCw}
          variant={summary.average_turnover_rate < 10 ? 'warning' : 'success'}
          subtitle="Taux de rotation annuel"
        />

        <StockKPICard
          title="Classe A"
          value={summary.abc_a_count}
          icon={BarChart3}
          variant="success"
          subtitle={`${formatNumber(summary.abc_a_value_percentage, 0)}% de la valeur`}
        />

        <StockKPICard
          title="Produits en Alerte"
          value={summary.products_below_minimum}
          icon={AlertTriangle}
          variant={summary.products_below_minimum > 0 ? 'danger' : 'success'}
          subtitle="Stock < Minimum"
        />

        <StockKPICard
          title="Produits Inactifs"
          value={summary.products_inactive_30d}
          icon={Clock}
          variant={summary.products_inactive_30d > 10 ? 'warning' : 'default'}
          subtitle=">30 jours sans sortie"
        />
      </div>

      {/* Distributions ABC & XYZ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution ABC */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution ABC</CardTitle>
            <CardDescription>
              Classification Pareto 80/15/5 sur la valeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {abc_classes.map(cls => (
                <div
                  key={cls.class_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={cls.color}>{cls.class_id}</Badge>
                    <div>
                      <p className="font-medium text-sm">{cls.label}</p>
                      <p className="text-xs text-gray-500">{cls.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{cls.count} produits</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(cls.percentage, 1)}% valeur
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribution XYZ */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution XYZ</CardTitle>
            <CardDescription>Variabilité de la demande</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {xyz_classes.map(cls => (
                <div
                  key={cls.class_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={cls.color}>{cls.class_id}</Badge>
                    <div>
                      <p className="font-medium text-sm">{cls.label}</p>
                      <p className="text-xs text-gray-500">{cls.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{cls.count} produits</p>
                    <p className="text-xs text-gray-500">{cls.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Top 20 Haute Valeur */}
      <Card>
        <CardHeader>
          <CardTitle>Top 20 - Haute Valeur Stock</CardTitle>
          <CardDescription>
            Produits avec la plus forte valeur d'inventaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rang</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="text-right">ADU</TableHead>
                <TableHead className="text-right">Rotation</TableHead>
                <TableHead className="text-center">ABC</TableHead>
                <TableHead className="text-center">XYZ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top_20_high_value.map((product, index) => (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {product.product_image_url ? (
                        <Image
                          src={product.product_image_url}
                          alt={product.product_name}
                          width={40}
                          height={40}
                          className="rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {product.product_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock_current}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(product.stock_value, 0)} €
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.adu)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.turnover_rate, 1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getABCBadgeColor(product.abc_class)}>
                      {product.abc_class}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getXYZBadgeColor(product.xyz_class)}>
                      {product.xyz_class}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Table Top 20 Faible Rotation */}
      <Card>
        <CardHeader>
          <CardTitle>Top 20 - Faible Rotation</CardTitle>
          <CardDescription>
            Produits avec le taux de rotation le plus faible (risque
            immobilisation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Rotation</TableHead>
                <TableHead className="text-right">Couverture</TableHead>
                <TableHead className="text-right">Inactivité</TableHead>
                <TableHead className="text-center">ABC</TableHead>
                <TableHead className="text-center">XYZ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top_20_low_turnover.map(product => (
                <TableRow key={product.product_id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {product.product_image_url ? (
                        <Image
                          src={product.product_image_url}
                          alt={product.product_name}
                          width={40}
                          height={40}
                          className="rounded object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {product.product_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock_current}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.turnover_rate < 5
                          ? 'text-red-600 font-bold'
                          : ''
                      }
                    >
                      {formatNumber(product.turnover_rate, 1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.coverage_days > 900
                      ? '∞'
                      : `${formatNumber(product.coverage_days, 0)}j`}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.days_inactive !== null
                      ? `${product.days_inactive}j`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getABCBadgeColor(product.abc_class)}>
                      {product.abc_class}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getXYZBadgeColor(product.xyz_class)}>
                      {product.xyz_class}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Rapport généré le{' '}
          {new Date(report.generated_at).toLocaleString('fr-FR')}
        </p>
        <p className="mt-1">
          {products.length} produits analysés • Période: 90 jours
        </p>
      </div>
    </div>
  );
}
