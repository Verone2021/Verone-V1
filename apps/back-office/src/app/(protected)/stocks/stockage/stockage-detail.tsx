'use client';

/**
 * AllocationRow and Tab components for Stockage page
 *
 * @module stockage-detail
 * @since 2025-12-20
 */

import { useState } from 'react';

import {
  Badge,
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@verone/ui';
import {
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  Calculator,
  Loader2,
  Minus,
  Pencil,
} from 'lucide-react';

import type {
  useAffiliateStorageDetail,
  useStorageEventsHistory,
  useStorageWeightedAverage,
} from './hooks/use-storage-billing';
import {
  formatVolumeM3,
  getSourceColor,
  getSourceLabel,
} from './hooks/use-storage-billing';
import { type AllocationData } from './stockage-types';

function AllocationQtyCell({
  allocation,
  onUpdateQuantity,
}: {
  allocation: AllocationData;
  onUpdateQuantity: (id: string, qty: number) => Promise<void>;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(String(allocation.stock_quantity));

  const handleQtyBlur = () => {
    setEditingQty(false);
    const newQty = parseInt(qtyValue, 10);
    if (!isNaN(newQty) && newQty >= 0 && newQty !== allocation.stock_quantity) {
      void onUpdateQuantity(allocation.allocation_id, newQty).catch(error => {
        console.error('[Stockage] updateQuantity failed:', error);
      });
    } else {
      setQtyValue(String(allocation.stock_quantity));
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    if (e.key === 'Escape') {
      setQtyValue(String(allocation.stock_quantity));
      setEditingQty(false);
    }
  };

  if (editingQty) {
    return (
      <Input
        type="number"
        min={0}
        value={qtyValue}
        onChange={e => setQtyValue(e.target.value)}
        onBlur={handleQtyBlur}
        onKeyDown={handleQtyKeyDown}
        className="w-20 text-right ml-auto"
        autoFocus
      />
    );
  }
  return (
    <button
      onClick={() => {
        setQtyValue(String(allocation.stock_quantity));
        setEditingQty(true);
      }}
      className="inline-flex items-center gap-1 font-medium hover:text-blue-600 transition-colors"
      title="Cliquer pour modifier"
    >
      {allocation.stock_quantity}
      <Pencil className="h-3 w-3 text-gray-400" />
    </button>
  );
}

function AllocationDateCell({
  allocation,
  onUpdateStartDate,
}: {
  allocation: AllocationData;
  onUpdateStartDate: (id: string, date: Date | undefined) => Promise<void>;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const startDate = allocation.storage_start_date
    ? new Date(allocation.storage_start_date + 'T00:00:00')
    : undefined;

  return (
    <Popover open={dateOpen} onOpenChange={setDateOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-normal gap-1.5"
        >
          <CalendarIcon className="h-3 w-3" />
          {startDate ? startDate.toLocaleDateString('fr-FR') : 'Non defini'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={startDate}
          onSelect={(date: Date | undefined) => {
            setDateOpen(false);
            void onUpdateStartDate(allocation.allocation_id, date).catch(
              error => {
                console.error('[Stockage] updateStartDate failed:', error);
              }
            );
          }}
          defaultMonth={startDate}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface AllocationRowProps {
  allocation: AllocationData;
  onToggleBillable: (id: string, current: boolean) => Promise<void>;
  onUpdateQuantity: (id: string, qty: number) => Promise<void>;
  onUpdateStartDate: (id: string, date: Date | undefined) => Promise<void>;
  isPending: boolean;
}

export function AllocationRow({
  allocation,
  onToggleBillable,
  onUpdateQuantity,
  onUpdateStartDate,
  isPending,
}: AllocationRowProps) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium">{allocation.product_name}</p>
        <p className="text-sm text-gray-500">{allocation.product_sku}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <AllocationQtyCell
          allocation={allocation}
          onUpdateQuantity={onUpdateQuantity}
        />
      </td>
      <td className="px-4 py-3 text-right">
        {formatVolumeM3(allocation.total_volume_m3)}
      </td>
      <td className="px-4 py-3">
        <AllocationDateCell
          allocation={allocation}
          onUpdateStartDate={onUpdateStartDate}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <Switch
            checked={allocation.billable_in_storage}
            onCheckedChange={() => {
              void onToggleBillable(
                allocation.allocation_id,
                allocation.billable_in_storage
              ).catch(error => {
                console.error('[Stockage] handleToggleBillable failed:', error);
              });
            }}
            disabled={isPending}
          />
        </div>
      </td>
    </tr>
  );
}

export function AllocationsTab({
  detailData,
  detailLoading,
  onToggleBillable,
  onUpdateQuantity,
  onUpdateStartDate,
  isPending,
}: {
  detailData: ReturnType<typeof useAffiliateStorageDetail>['data'];
  detailLoading: boolean;
  onToggleBillable: (id: string, current: boolean) => Promise<void>;
  onUpdateQuantity: (id: string, qty: number) => Promise<void>;
  onUpdateStartDate: (id: string, date: Date | undefined) => Promise<void>;
  isPending: boolean;
}) {
  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!detailData || detailData.allocations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun produit en stockage
      </div>
    );
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
              Produit
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
              Qty
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
              Volume
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
              Debut stockage
            </th>
            <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
              Facturable
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {detailData.allocations.map(allocation => (
            <AllocationRow
              key={allocation.allocation_id}
              allocation={allocation}
              onToggleBillable={onToggleBillable}
              onUpdateQuantity={onUpdateQuantity}
              onUpdateStartDate={onUpdateStartDate}
              isPending={isPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillingWeightedCard({
  weightedAverage,
  currentMonthName,
}: {
  weightedAverage: ReturnType<typeof useStorageWeightedAverage>['data'];
  currentMonthName: string;
}) {
  if (!weightedAverage) return null;
  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5" />
        Moyenne ponderee - {currentMonthName}
      </h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Moyenne m3 (total)</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatVolumeM3(weightedAverage.average_m3)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            sur {weightedAverage.days_in_period} jours
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Moyenne m3 (facturable)</p>
          <p className="text-3xl font-bold text-green-600">
            {formatVolumeM3(weightedAverage.billable_average_m3)}
          </p>
          <p className="text-xs text-gray-500 mt-1">base de facturation</p>
        </div>
      </div>
      <div className="mt-4 p-3 bg-white rounded border border-blue-200">
        <p className="text-sm text-gray-600">
          <strong>Formule:</strong> Σ(volume × duree en jours) / jours du mois
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Cette moyenne ponderee reflete l&apos;utilisation reelle du stockage
          sur la periode, tenant compte des variations de stock.
        </p>
      </div>
    </div>
  );
}

export function BillingTab({
  avgLoading,
  weightedAverage,
  currentMonthName,
}: {
  avgLoading: boolean;
  weightedAverage: ReturnType<typeof useStorageWeightedAverage>['data'];
  currentMonthName: string;
}) {
  if (avgLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <BillingWeightedCard
        weightedAverage={weightedAverage}
        currentMonthName={currentMonthName}
      />
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Le tarif de facturation (EUR/m3/mois) sera
          configure dans une version ulterieure.
        </p>
      </div>
    </div>
  );
}

function HistoryEventRow({
  event,
}: {
  event: NonNullable<
    ReturnType<typeof useStorageEventsHistory>['data']
  >[number];
}) {
  const sourceColor = getSourceColor(event.source);
  return (
    <tr className="text-sm">
      <td className="px-4 py-2 text-gray-500">
        {new Date(event.happened_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="px-4 py-2">
        <p className="font-medium">{event.product_name}</p>
        <p className="text-xs text-gray-400">{event.product_sku}</p>
      </td>
      <td className="px-4 py-2">
        <Badge
          variant="outline"
          className={`
            ${sourceColor === 'green' ? 'border-green-300 text-green-700' : ''}
            ${sourceColor === 'blue' ? 'border-blue-300 text-blue-700' : ''}
            ${sourceColor === 'red' ? 'border-red-300 text-red-700' : ''}
            ${sourceColor === 'amber' ? 'border-amber-300 text-amber-700' : ''}
            ${sourceColor === 'gray' ? 'border-gray-300 text-gray-700' : ''}
          `}
        >
          {getSourceLabel(event.source)}
        </Badge>
      </td>
      <td className="px-4 py-2 text-right">
        <span className="flex items-center justify-end gap-1">
          {event.qty_change > 0 && (
            <ArrowUp className="h-3 w-3 text-green-500" />
          )}
          {event.qty_change < 0 && (
            <ArrowDown className="h-3 w-3 text-red-500" />
          )}
          {event.qty_change === 0 && (
            <Minus className="h-3 w-3 text-gray-400" />
          )}
          <span
            className={
              event.qty_change > 0
                ? 'text-green-600'
                : event.qty_change < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
            }
          >
            {event.qty_change > 0 ? '+' : ''}
            {event.qty_change}
          </span>
        </span>
      </td>
      <td className="px-4 py-2 text-right text-gray-500">
        {event.volume_m3_change > 0 ? '+' : ''}
        {formatVolumeM3(event.volume_m3_change)}
      </td>
    </tr>
  );
}

export function HistoryTab({
  historyLoading,
  eventsHistory,
}: {
  historyLoading: boolean;
  eventsHistory: ReturnType<typeof useStorageEventsHistory>['data'];
}) {
  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!eventsHistory || eventsHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun historique disponible
      </div>
    );
  }
  return (
    <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b sticky top-0">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
              Date
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
              Produit
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
              Action
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
              Qty
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
              Volume
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {eventsHistory.map(event => (
            <HistoryEventRow key={event.id} event={event} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
