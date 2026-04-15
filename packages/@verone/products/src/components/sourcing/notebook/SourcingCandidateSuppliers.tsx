'use client';

import { useState } from 'react';

import type { SourcingCandidateSupplier } from '../../../hooks/sourcing/use-sourcing-notebook';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/ui';
import {
  Users,
  Plus,
  X,
  Check,
  XCircle,
  Clock,
  Star,
  Building2,
} from 'lucide-react';

const STATUS_CONFIG = {
  identified: {
    label: 'Identifie',
    className: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  contacted: {
    label: 'Contacte',
    className: 'bg-blue-100 text-blue-700',
    icon: Building2,
  },
  quoted: {
    label: 'Devis recu',
    className: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
  selected: {
    label: 'Selectionne',
    className: 'bg-green-100 text-green-700',
    icon: Check,
  },
  rejected: {
    label: 'Rejete',
    className: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
} as const;

interface SourcingCandidateSuppliersProps {
  candidates: SourcingCandidateSupplier[];
  onAdd: (data: {
    supplier_id: string;
    quoted_price?: number;
    quoted_moq?: number;
    quoted_lead_days?: number;
    notes?: string;
  }) => Promise<void>;
  onUpdateStatus: (candidateId: string, status: string) => Promise<void>;
  supplierSearch?: {
    query: string;
    results: Array<{
      id: string;
      trade_name: string | null;
      legal_name: string | null;
    }>;
    setQuery: (q: string) => void;
    loading: boolean;
  };
}

export function SourcingCandidateSuppliers({
  candidates,
  onAdd,
  onUpdateStatus,
  supplierSearch,
}: SourcingCandidateSuppliersProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '',
    supplier_name: '',
    quoted_price: '',
    quoted_moq: '',
    quoted_lead_days: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.supplier_id) return;
    setSaving(true);
    try {
      await onAdd({
        supplier_id: form.supplier_id,
        quoted_price: form.quoted_price
          ? parseFloat(form.quoted_price)
          : undefined,
        quoted_moq: form.quoted_moq ? parseInt(form.quoted_moq) : undefined,
        quoted_lead_days: form.quoted_lead_days
          ? parseInt(form.quoted_lead_days)
          : undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({
        supplier_id: '',
        supplier_name: '',
        quoted_price: '',
        quoted_moq: '',
        quoted_lead_days: '',
        notes: '',
      });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = candidates.filter(c => c.status === 'selected').length;
  const quotedCount = candidates.filter(c => c.status === 'quoted').length;

  // Find best price among quoted/selected candidates
  const quotedCandidates = candidates.filter(
    c => c.quoted_price && (c.status === 'quoted' || c.status === 'selected')
  );
  const bestPrice = quotedCandidates.length
    ? Math.min(...quotedCandidates.map(c => c.quoted_price!))
    : null;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fournisseurs candidats ({candidates.length})
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
        {/* Summary badges */}
        {candidates.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {selectedCount} selectionne(s)
              </span>
            )}
            {quotedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                {quotedCount} devis recu(s)
              </span>
            )}
            {bestPrice && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Meilleur prix : {bestPrice.toFixed(2)} EUR
              </span>
            )}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            {/* Supplier search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={form.supplier_name}
                onChange={e => {
                  setForm(f => ({
                    ...f,
                    supplier_name: e.target.value,
                    supplier_id: '',
                  }));
                  supplierSearch?.setQuery(e.target.value);
                }}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
              />
              {supplierSearch &&
                form.supplier_name.length >= 2 &&
                !form.supplier_id && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {supplierSearch.loading ? (
                      <div className="p-2 text-xs text-gray-400">
                        Recherche...
                      </div>
                    ) : supplierSearch.results.length === 0 ? (
                      <div className="p-2 text-xs text-gray-400">
                        Aucun fournisseur trouve
                      </div>
                    ) : (
                      supplierSearch.results.map(s => (
                        <button
                          key={s.id}
                          onClick={() =>
                            setForm(f => ({
                              ...f,
                              supplier_id: s.id,
                              supplier_name: s.trade_name ?? s.legal_name ?? '',
                            }))
                          }
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">
                            {s.trade_name ?? s.legal_name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              {form.supplier_id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Prix (EUR)"
                value={form.quoted_price}
                onChange={e =>
                  setForm(f => ({ ...f, quoted_price: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
              <input
                type="number"
                placeholder="MOQ"
                value={form.quoted_moq}
                onChange={e =>
                  setForm(f => ({ ...f, quoted_moq: e.target.value }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
              <input
                type="number"
                placeholder="Delai (jours)"
                value={form.quoted_lead_days}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    quoted_lead_days: e.target.value,
                  }))
                }
                className="text-xs border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <input
              type="text"
              placeholder="Notes (optionnel)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!form.supplier_id || saving}
              className="w-full"
            >
              {saving ? 'Enregistrement...' : 'Ajouter le fournisseur'}
            </ButtonV2>
          </div>
        )}

        {/* Candidates list */}
        {candidates.length === 0 && !showForm ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucun fournisseur candidat
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {candidates.map(candidate => {
              const statusConfig =
                STATUS_CONFIG[candidate.status as keyof typeof STATUS_CONFIG] ??
                STATUS_CONFIG.identified;
              const isBest =
                bestPrice !== null &&
                candidate.quoted_price === bestPrice &&
                candidate.status !== 'rejected';

              return (
                <div
                  key={candidate.id}
                  className={cn(
                    'p-3 rounded-md border text-xs',
                    candidate.status === 'selected'
                      ? 'bg-green-50 border-green-200'
                      : candidate.status === 'rejected'
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200'
                  )}
                >
                  {/* Header: name + status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {candidate.supplier?.trade_name ??
                          candidate.supplier?.legal_name ??
                          'Fournisseur inconnu'}
                      </span>
                      {isBest && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        statusConfig.className
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <span className="text-gray-400 block">Prix</span>
                      <span
                        className={cn(
                          'font-bold',
                          isBest ? 'text-green-700' : 'text-gray-900'
                        )}
                      >
                        {candidate.quoted_price
                          ? `${candidate.quoted_price.toFixed(2)} EUR`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">MOQ</span>
                      <span className="font-medium text-gray-900">
                        {candidate.quoted_moq
                          ? `${candidate.quoted_moq} pcs`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Delai</span>
                      <span className="font-medium text-gray-900">
                        {candidate.quoted_lead_days
                          ? `${candidate.quoted_lead_days} j`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {candidate.notes && (
                    <p className="text-gray-500 mb-2 italic">
                      {candidate.notes}
                    </p>
                  )}

                  {/* Actions */}
                  {candidate.status !== 'selected' &&
                    candidate.status !== 'rejected' && (
                      <div className="flex gap-1 pt-1 border-t border-gray-100">
                        {candidate.status === 'identified' && (
                          <button
                            onClick={() => {
                              void onUpdateStatus(candidate.id, 'contacted');
                            }}
                            className="text-[10px] px-2 py-0.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            Marquer contacte
                          </button>
                        )}
                        {(candidate.status === 'identified' ||
                          candidate.status === 'contacted') && (
                          <button
                            onClick={() => {
                              void onUpdateStatus(candidate.id, 'quoted');
                            }}
                            className="text-[10px] px-2 py-0.5 rounded border border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                          >
                            Devis recu
                          </button>
                        )}
                        <button
                          onClick={() => {
                            void onUpdateStatus(candidate.id, 'selected');
                          }}
                          className="text-[10px] px-2 py-0.5 rounded border border-green-200 text-green-600 hover:bg-green-50"
                        >
                          Selectionner
                        </button>
                        <button
                          onClick={() => {
                            void onUpdateStatus(candidate.id, 'rejected');
                          }}
                          className="text-[10px] px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}

                  {/* Reactivate rejected */}
                  {candidate.status === 'rejected' && (
                    <div className="flex gap-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => {
                          void onUpdateStatus(candidate.id, 'identified');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        Reactiver
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
