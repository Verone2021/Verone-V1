'use client';

import { useState } from 'react';
import type { SourcingPriceEntry } from '../../../hooks/sourcing/use-sourcing-notebook';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/ui';
import { TrendingDown, Plus, X } from 'lucide-react';

interface SourcingPriceHistoryProps {
  priceHistory: SourcingPriceEntry[];
  onAdd: (data: {
    price: number;
    currency?: string;
    quantity?: number;
    proposed_by?: 'supplier' | 'verone';
    notes?: string;
  }) => Promise<void>;
  currentCostPrice?: number | null;
  targetPrice?: number | null;
}

export function SourcingPriceHistory({
  priceHistory,
  onAdd,
  currentCostPrice,
  targetPrice,
}: SourcingPriceHistoryProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    price: '',
    currency: 'USD',
    quantity: '',
    proposed_by: 'supplier' as 'supplier' | 'verone',
    notes: '',
  });

  const handleSubmit = async () => {
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      await onAdd({
        price,
        currency: form.currency,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        proposed_by: form.proposed_by,
        notes: form.notes.trim() || undefined,
      });
      setForm({
        price: '',
        currency: 'USD',
        quantity: '',
        proposed_by: 'supplier',
        notes: '',
      });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  // Calculate trend
  const latestPrice = priceHistory[0]?.price;
  const previousPrice = priceHistory[1]?.price;
  const trend =
    latestPrice && previousPrice
      ? (((latestPrice - previousPrice) / previousPrice) * 100).toFixed(1)
      : null;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Historique prix ({priceHistory.length})
          </CardTitle>
          <ButtonV2
            variant="outline"
            size="sm"
            icon={showForm ? X : Plus}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuler' : 'Ajouter'}
          </ButtonV2>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        {(currentCostPrice ?? targetPrice ?? latestPrice) && (
          <div className="grid grid-cols-3 gap-2">
            {targetPrice && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                <div className="text-[10px] text-blue-600">Prix cible</div>
                <div className="text-sm font-bold text-blue-800">
                  {targetPrice} EUR
                </div>
              </div>
            )}
            {latestPrice && (
              <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                <div className="text-[10px] text-gray-600">Dernier prix</div>
                <div className="text-sm font-bold">
                  {latestPrice} {priceHistory[0]?.currency}
                </div>
                {trend && (
                  <div
                    className={cn(
                      'text-[10px]',
                      parseFloat(trend) < 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {parseFloat(trend) < 0 ? '↓' : '↑'}{' '}
                    {Math.abs(parseFloat(trend))}%
                  </div>
                )}
              </div>
            )}
            {currentCostPrice && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                <div className="text-[10px] text-green-600">
                  Prix achat actuel
                </div>
                <div className="text-sm font-bold text-green-800">
                  {currentCostPrice} EUR
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Prix"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
              <select
                value={form.currency}
                onChange={e =>
                  setForm(f => ({ ...f, currency: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CNY">CNY</option>
                <option value="GBP">GBP</option>
              </select>
              <input
                type="number"
                placeholder="Qté (opt.)"
                value={form.quantity}
                onChange={e =>
                  setForm(f => ({ ...f, quantity: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.proposed_by}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    proposed_by: e.target.value as 'supplier' | 'verone',
                  }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              >
                <option value="supplier">Proposé par fournisseur</option>
                <option value="verone">Proposé par Verone</option>
              </select>
              <input
                type="text"
                placeholder="Notes (optionnel)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!form.price || saving}
              className="w-full"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le prix'}
            </ButtonV2>
          </div>
        )}

        {/* Price timeline */}
        {priceHistory.length === 0 && !showForm ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucun historique de prix
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {priceHistory.map(entry => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md border text-xs',
                  entry.proposed_by === 'verone'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      entry.proposed_by === 'verone'
                        ? 'bg-blue-200 text-blue-700'
                        : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {entry.proposed_by === 'verone' ? 'Verone' : 'Fournisseur'}
                  </span>
                  <span className="font-bold">
                    {entry.price} {entry.currency}
                  </span>
                  {entry.quantity && (
                    <span className="text-gray-500">
                      × {entry.quantity} pcs
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.notes && (
                    <span className="text-gray-400 truncate max-w-[120px]">
                      {entry.notes}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {new Date(entry.negotiated_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
