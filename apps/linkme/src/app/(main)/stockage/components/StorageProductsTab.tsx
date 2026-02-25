'use client';

/**
 * StorageProductsTab — Onglet Détail par produit
 *
 * Table filtrable avec historique par produit (lignes extensibles)
 * Badge d'ancienneté coloré, tri par colonnes
 *
 * @module StorageProductsTab
 * @since 2026-02-25
 */

import { useState, useMemo } from 'react';

import { Card } from '@tremor/react';
import Image from 'next/image';
import {
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
} from 'lucide-react';

import type {
  StorageAllocation,
  StoragePricingTier,
  StorageMonthlyRow,
} from '@/lib/hooks/use-affiliate-storage';
import {
  formatVolume,
  formatPrice,
  calculateStoragePrice,
  formatMonthLabel,
} from '@/lib/hooks/use-affiliate-storage';

interface StorageProductsTabProps {
  products: StorageAllocation[] | undefined;
  pricingTiers: StoragePricingTier[] | undefined;
  monthlyData: StorageMonthlyRow[] | undefined;
  isLoading: boolean;
}

type SortField = 'name' | 'quantity' | 'volume' | 'cost' | 'age';
type SortDir = 'asc' | 'desc';

function getAgeDays(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getAgeBadge(days: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (days <= 90)
    return {
      label: `${days}j`,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    };
  if (days <= 180)
    return {
      label: `${days}j`,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    };
  return {
    label: `${days}j`,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  };
}

export function StorageProductsTab({
  products,
  pricingTiers,
  monthlyData,
  isLoading,
}: StorageProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Filtrer par recherche
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      p =>
        p.product_name.toLowerCase().includes(q) ||
        p.product_sku.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Trier
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.product_name.localeCompare(b.product_name);
          break;
        case 'quantity':
          cmp = a.stock_quantity - b.stock_quantity;
          break;
        case 'volume':
          cmp = a.total_volume_m3 - b.total_volume_m3;
          break;
        case 'cost': {
          const costA = pricingTiers
            ? calculateStoragePrice(a.total_volume_m3, pricingTiers)
            : 0;
          const costB = pricingTiers
            ? calculateStoragePrice(b.total_volume_m3, pricingTiers)
            : 0;
          cmp = costA - costB;
          break;
        }
        case 'age':
          cmp =
            getAgeDays(a.storage_start_date) - getAgeDays(b.storage_start_date);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredProducts, sortField, sortDir, pricingTiers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Mois où ce produit était stocké (pour le détail extensible)
  const getProductMonths = (startDate: string): StorageMonthlyRow[] => {
    if (!monthlyData) return [];
    const allocDate = new Date(startDate);
    return monthlyData.filter(m => new Date(m.month_date) >= allocDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun produit en stock</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou SKU..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
        />
      </div>

      {/* Table produits */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 w-12" />
                <SortHeader
                  label="Produit"
                  field="name"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Quantité"
                  field="quantity"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortHeader
                  label="Volume"
                  field="volume"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortHeader
                  label="Coût/mois"
                  field="cost"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortHeader
                  label="Ancienneté"
                  field="age"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProducts.map(product => {
                const isExpanded = expandedId === product.allocation_id;
                const ageDays = getAgeDays(product.storage_start_date);
                const badge = getAgeBadge(ageDays);
                const cost = pricingTiers
                  ? calculateStoragePrice(product.total_volume_m3, pricingTiers)
                  : 0;
                const productMonths = isExpanded
                  ? getProductMonths(product.storage_start_date)
                  : [];

                return (
                  <ProductRow
                    key={product.allocation_id}
                    product={product}
                    isExpanded={isExpanded}
                    ageDays={ageDays}
                    badge={badge}
                    cost={cost}
                    productMonths={productMonths}
                    onToggle={() =>
                      setExpandedId(isExpanded ? null : product.allocation_id)
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
          <span>
            {sortedProducts.length} produit
            {sortedProducts.length > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />{' '}
            &lt;90j
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-2" />{' '}
            91-180j
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-2" />{' '}
            &gt;180j
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
  className = '',
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  className?: string;
}) {
  const isActive = current === field;
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`font-medium hover:text-gray-900 transition-colors ${
          isActive ? 'text-[#5DBEBB]' : 'text-gray-600'
        }`}
      >
        {label}
        {isActive && <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

function ProductRow({
  product,
  isExpanded,
  ageDays,
  badge,
  cost,
  productMonths,
  onToggle,
}: {
  product: StorageAllocation;
  isExpanded: boolean;
  ageDays: number;
  badge: { label: string; color: string; bgColor: string };
  cost: number;
  productMonths: StorageMonthlyRow[];
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </td>
        <td className="px-4 py-3">
          {product.product_image_url ? (
            <Image
              src={product.product_image_url}
              alt={product.product_name}
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">{product.product_name}</p>
            <p className="text-xs text-gray-500 font-mono">
              {product.product_sku}
            </p>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-gray-700">
          {product.stock_quantity}
        </td>
        <td className="px-4 py-3 text-right text-gray-700">
          {formatVolume(product.total_volume_m3)}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-[#5DBEBB]">
          {formatPrice(cost)}
        </td>
        <td className="px-4 py-3 text-right">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color}`}
          >
            <Clock className="h-3 w-3" />
            {badge.label}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-8 py-3">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Historique de stockage — {product.product_name}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              En stock depuis le{' '}
              {new Date(product.storage_start_date).toLocaleDateString('fr-FR')}{' '}
              ({ageDays} jours)
            </p>
            {productMonths.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {productMonths.map(m => (
                  <div
                    key={m.month_date}
                    className="bg-white rounded-lg border px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-gray-700">
                      {formatMonthLabel(m.month_val, m.year_val)}
                    </p>
                    <p className="text-gray-500">
                      {product.stock_quantity} unité
                      {product.stock_quantity > 1 ? 's' : ''} ·{' '}
                      {formatVolume(product.total_volume_m3)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Pas d&apos;historique disponible
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
