'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

export interface SalesOrderStatsData {
  total_orders: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  eco_tax_total: number;
  average_basket: number;
  pending_orders: number;
  shipped_orders: number;
}

export interface SalesOrderStatsCardsProps {
  stats: SalesOrderStatsData;
}

export function SalesOrderStatsCards({ stats }: SalesOrderStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_orders}</div>
          <p className="text-xs text-gray-500 mt-1">commandes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Chiffre d&apos;affaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.total_ttc)}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <div>HT: {formatCurrency(stats.total_ht)}</div>
            {stats.eco_tax_total > 0 && (
              <div className="text-amber-600">
                Eco-taxe HT: {formatCurrency(stats.eco_tax_total)}
              </div>
            )}
            <div>TVA: {formatCurrency(stats.total_tva)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Panier Moyen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.average_basket)}
          </div>
          <p className="text-xs text-gray-500 mt-1">par commande</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            En cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.pending_orders}
          </div>
          <p className="text-xs text-gray-500 mt-1">draft + validee</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Expediees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.shipped_orders}
          </div>
          <p className="text-xs text-gray-500 mt-1">commandes</p>
        </CardContent>
      </Card>
    </div>
  );
}
