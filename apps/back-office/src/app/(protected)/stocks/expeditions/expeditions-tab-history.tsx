'use client';

import React from 'react';

import { ProductThumbnail } from '@verone/products';
import { Badge, ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { TabsContent } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import {
  Package,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
} from 'lucide-react';

import type {
  SalesOrder,
  SalesOrderItem,
  ProductImage,
} from './expeditions-types';

// -- Order product item in the expandable history row --

function HistoryProductItem({ item }: { item: SalesOrderItem }) {
  const primaryImg =
    item.products?.product_images?.find((img: ProductImage) => img.is_primary)
      ?.public_url ?? item.products?.product_images?.[0]?.public_url;
  return (
    <div className="flex items-center gap-4 p-2 bg-white rounded-lg border">
      <ProductThumbnail
        src={primaryImg}
        alt={item.products?.name ?? 'Produit'}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.products?.name ?? 'Produit inconnu'}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          SKU: {item.products?.sku ?? 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {item.quantity_shipped ?? 0} / {item.quantity} expédié(s)
        </p>
        <p className="text-xs text-gray-500">
          Stock: {item.products?.stock_real ?? '-'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {formatCurrency(item.unit_price_ht * item.quantity)}
        </p>
        <p className="text-xs text-gray-500">
          {formatCurrency(item.unit_price_ht)} HT/u
        </p>
      </div>
    </div>
  );
}

function HistoryOrderItems({ order }: { order: SalesOrder }) {
  return (
    <div className="p-4">
      <h4 className="font-medium text-sm mb-3 text-gray-700">
        Produits de la commande ({order.sales_order_items?.length ?? 0})
      </h4>
      <div className="space-y-2">
        {order.sales_order_items?.map((item: SalesOrderItem) => (
          <HistoryProductItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// -- Expandable history table row --

interface HistoryRowProps {
  order: SalesOrder;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onViewHistory: (order: SalesOrder) => void;
}

function HistoryRow({
  order,
  isExpanded,
  onToggle,
  onViewHistory,
}: HistoryRowProps) {
  const totalItems =
    order.sales_order_items?.reduce(
      (sum: number, item: SalesOrderItem) => sum + item.quantity,
      0
    ) ?? 0;
  return (
    <React.Fragment>
      <TableRow
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => onToggle(order.id)}
      >
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </TableCell>
        <TableCell className="font-medium">{order.order_number}</TableCell>
        <TableCell>{order.customer_name ?? 'Client inconnu'}</TableCell>
        <TableCell>
          <Badge
            className={
              order.status === 'shipped'
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white'
            }
          >
            {order.status === 'shipped' ? 'Expédiée' : 'Livrée'}
          </Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {order.shipped_at ? formatDate(order.shipped_at) : '-'}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {order.delivered_at ? formatDate(order.delivered_at) : '-'}
        </TableCell>
        <TableCell className="hidden xl:table-cell">
          {totalItems} unité(s)
        </TableCell>
        <TableCell>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onViewHistory(order);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir détails
          </ButtonV2>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow key={`${order.id}-details`}>
          <TableCell colSpan={8} className="bg-gray-50 p-0">
            <HistoryOrderItems order={order} />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

// -- History tab filters --

interface HistoryFiltersProps {
  historySearchTerm: string;
  historyStatusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
}

function HistoryFilters({
  historySearchTerm,
  historyStatusFilter,
  onSearchChange,
  onStatusFilterChange,
}: HistoryFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro de commande ou client..."
                value={historySearchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={historyStatusFilter}
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes expédiées</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// -- History orders table --

interface HistoryTableProps {
  historyOrders: SalesOrder[];
  loading: boolean;
  error: string | null;
  expandedHistoryRows: Set<string>;
  onToggleRow: (id: string) => void;
  onViewHistory: (order: SalesOrder) => void;
}

function HistoryOrdersTable({
  historyOrders,
  loading,
  error,
  expandedHistoryRows,
  onToggleRow,
  onViewHistory,
}: HistoryTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }
  if (error) {
    return <div className="text-center py-8 text-red-600">Erreur: {error}</div>;
  }
  if (historyOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">
          Aucune expédition dans l&apos;historique
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>N° Commande</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden lg:table-cell">
              Date expédition
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              Date livraison
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              Quantité totale
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyOrders.map((order: SalesOrder) => (
            <HistoryRow
              key={order.id}
              order={order}
              isExpanded={expandedHistoryRows.has(order.id)}
              onToggle={onToggleRow}
              onViewHistory={onViewHistory}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// -- Main HistoryTab export --

interface HistoryTabProps {
  historyOrders: SalesOrder[];
  loading: boolean;
  error: string | null;
  historySearchTerm: string;
  historyStatusFilter: string;
  expandedHistoryRows: Set<string>;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onToggleRow: (id: string) => void;
  onViewHistory: (order: SalesOrder) => void;
}

export function HistoryTab({
  historyOrders,
  loading,
  error,
  historySearchTerm,
  historyStatusFilter,
  expandedHistoryRows,
  onSearchChange,
  onStatusFilterChange,
  onToggleRow,
  onViewHistory,
}: HistoryTabProps) {
  return (
    <TabsContent value="history" className="space-y-4 mt-6">
      <HistoryFilters
        historySearchTerm={historySearchTerm}
        historyStatusFilter={historyStatusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
      />
      <Card>
        <CardHeader>
          <CardTitle>Historique expéditions</CardTitle>
          <CardDescription>
            {historyOrders.length} commande(s) expédiée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryOrdersTable
            historyOrders={historyOrders}
            loading={loading}
            error={error}
            expandedHistoryRows={expandedHistoryRows}
            onToggleRow={onToggleRow}
            onViewHistory={onViewHistory}
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
