'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { StockAlert } from '@verone/stock';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Box,
  ClipboardCheck,
  Loader2,
  Package,
  TrendingUp,
  Warehouse,
} from 'lucide-react';

// ---- Types ----

interface Movement {
  id: string;
  product_name?: string | null;
  product_image_url?: string | null;
  performed_at: string;
  quantity_change: number;
}

interface StockAlertsCardProps {
  alerts: StockAlert[];
  loading: boolean;
}

interface RecentMovementsCardProps {
  movements: Movement[];
  loading: boolean;
}

// ---- StockAlertsCard ----

export function StockAlertsCard({ alerts, loading }: StockAlertsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Alertes Stock</h2>
        </div>
        <Link
          href="/stocks/alertes"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir toutes &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-4 py-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chargement...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune alerte</p>
          </div>
        ) : (
          alerts.slice(0, 5).map(alert => (
            <Link
              key={alert.id}
              href={`/produits/catalogue/${alert.product_id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
            >
              {alert.product_image_url ? (
                <Image
                  src={alert.product_image_url}
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {alert.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  {alert.sku} · Stock: {alert.stock_real} / Min:{' '}
                  {alert.min_stock}
                </p>
              </div>
              <span
                className={`text-xs font-medium ${alert.stock_real <= 0 ? 'text-red-600' : 'text-orange-600'}`}
              >
                {alert.stock_real <= 0 ? 'Rupture' : 'Bas'}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ---- RecentMovementsCard ----

export function RecentMovementsCard({
  movements,
  loading,
}: RecentMovementsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            Derniers Mouvements
          </h2>
        </div>
        <Link
          href="/stocks/mouvements"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir tout &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-4 py-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Chargement...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <ArrowUpDown className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun mouvement</p>
          </div>
        ) : (
          movements.slice(0, 5).map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              {m.product_image_url ? (
                <Image
                  src={m.product_image_url}
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {m.product_name ?? 'Produit'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(m.performed_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {m.quantity_change > 0 ? '+' : ''}
                {m.quantity_change}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---- AnalyticsCard ----

interface AnalyticsCardProps {
  totalProducts: number;
  totalValue: number;
}

export function AnalyticsCard({
  totalProducts,
  totalValue,
}: AnalyticsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Analytics</h2>
        </div>
        <Link
          href="/stocks/analytics"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir detail &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        <Link
          href="/stocks/analytics"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {totalProducts} produits · Classification ABC/XYZ
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/stocks/analytics"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Valeur {(totalValue ?? 0).toLocaleString('fr-FR')} &euro; ·
              Rotation · Couverture
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/stocks/analytics"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Top 20 haute valeur · Produits inactifs
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}

// ---- PrevisionnelCard ----

export function PrevisionnelCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Previsionnel</h2>
        </div>
        <Link
          href="/stocks/previsionnel"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir detail &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        <Link
          href="/stocks/previsionnel"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Entrees et sorties prevues (commandes en cours)
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/stocks/previsionnel"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Box className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Impact stock par commande client et fournisseur
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}

// ---- AjustementsCard ----

export function AjustementsCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Ajustements</h2>
        </div>
        <Link
          href="/stocks/ajustements"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir tout &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        <Link
          href="/stocks/ajustements"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Historique des ajustements · Audit et tracabilite
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/stocks/mouvements"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Nouveau mouvement · Correction de stock
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}

// ---- StockageCard ----

export function StockageCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Stockage</h2>
        </div>
        <Link
          href="/stocks/stockage"
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir detail &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        <Link
          href="/stocks/stockage"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Warehouse className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Stockage entrepot · Volume et facturation m3
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
        <Link
          href="/stocks/stockage"
          className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Box className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              Allocations par enseigne et organisation
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
