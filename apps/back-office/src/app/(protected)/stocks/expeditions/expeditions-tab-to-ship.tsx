'use client';

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
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { TabsContent } from '@verone/ui';
import { Filter, Search, Package } from 'lucide-react';

import { OrderRow } from './expeditions-order-row';
import type { SalesOrder } from './expeditions-types';

interface ToShipTabProps {
  orders: SalesOrder[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  urgencyFilter: string;
  expandedRows: Set<string>;
  packlinkPendingOrders: Set<string>;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onUrgencyFilterChange: (v: string) => void;
  onToggleRow: (id: string) => void;
  onShip: (order: SalesOrder) => void;
}

function ToShipFilters({
  searchTerm,
  statusFilter,
  urgencyFilter,
  onSearchChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
}: Pick<
  ToShipTabProps,
  | 'searchTerm'
  | 'statusFilter'
  | 'urgencyFilter'
  | 'onSearchChange'
  | 'onStatusFilterChange'
  | 'onUrgencyFilterChange'
>) {
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
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="validated">Validée</SelectItem>
              <SelectItem value="partially_shipped">Partielle</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={onUrgencyFilterChange}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Urgence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="urgent">Urgent (&lt; 3j)</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function ToShipTableContent({
  orders,
  loading,
  error,
  expandedRows,
  packlinkPendingOrders,
  onToggleRow,
  onShip,
}: Pick<
  ToShipTabProps,
  | 'orders'
  | 'loading'
  | 'error'
  | 'expandedRows'
  | 'packlinkPendingOrders'
  | 'onToggleRow'
  | 'onShip'
>) {
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
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Aucune commande à expédier</p>
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
            <TableHead>Date livraison</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: SalesOrder) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedRows.has(order.id)}
              isPacklinkPending={packlinkPendingOrders.has(order.id)}
              onToggle={onToggleRow}
              onShip={onShip}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ToShipTab({
  orders,
  loading,
  error,
  searchTerm,
  statusFilter,
  urgencyFilter,
  expandedRows,
  packlinkPendingOrders,
  onSearchChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
  onToggleRow,
  onShip,
}: ToShipTabProps) {
  return (
    <TabsContent value="to-ship" className="space-y-4 mt-6">
      <ToShipFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        urgencyFilter={urgencyFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
        onUrgencyFilterChange={onUrgencyFilterChange}
      />
      <Card>
        <CardHeader>
          <CardTitle>Commandes à expédier</CardTitle>
          <CardDescription>
            {orders.length} commande(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToShipTableContent
            orders={orders}
            loading={loading}
            error={error}
            expandedRows={expandedRows}
            packlinkPendingOrders={packlinkPendingOrders}
            onToggleRow={onToggleRow}
            onShip={onShip}
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
