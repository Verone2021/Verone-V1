'use client';

/**
 * MarketingContentCard — Card 1 de l'onglet Descriptions.
 * Edition inline : description générale + selling points en chips.
 */

import { useState, useCallback } from 'react';

import { Plus, X, Save } from 'lucide-react';

import type { Product, ProductRow } from '../types';

interface MarketingContentCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function MarketingContentCard({
  product,
  onProductUpdate,
}: MarketingContentCardProps) {
  const [description, setDescription] = useState(product.description ?? '');
  const [sellingPoints, setSellingPoints] = useState<string[]>(
    (product.selling_points as string[] | null) ?? []
  );
  const [newPoint, setNewPoint] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const wordCount = countWords(description);

  const hasChanges =
    description !== (product.description ?? '') ||
    JSON.stringify(sellingPoints) !==
      JSON.stringify((product.selling_points as string[] | null) ?? []);

  const handleAddPoint = useCallback(() => {
    const trimmed = newPoint.trim();
    if (trimmed && !sellingPoints.includes(trimmed)) {
      setSellingPoints(prev => [...prev, trimmed]);
      setNewPoint('');
    }
  }, [newPoint, sellingPoints]);

  const handleRemovePoint = useCallback((index: number) => {
    setSellingPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddPoint();
      }
    },
    [handleAddPoint]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onProductUpdate({
        description: description.trim() || null,
        selling_points: sellingPoints.length > 0 ? sellingPoints : null,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } catch (err) {
      console.error('[MarketingContentCard] save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [description, sellingPoints, onProductUpdate]);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Contenu marketing
        </h3>
        <button
          type="button"
          onClick={() => {
            void handleSave().catch(err =>
              console.error('[MarketingContentCard]:', err)
            );
          }}
          disabled={!hasChanges || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-11 md:h-8"
        >
          <Save className="h-3.5 w-3.5" />
          {saving
            ? 'Enregistrement...'
            : savedAt
              ? 'Enregistré !'
              : 'Enregistrer'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Description générale */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Description générale
            </label>
            {wordCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                {wordCount} mot{wordCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Description générale du produit visible par les clients..."
            className="w-full border border-neutral-200 rounded-md text-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-y min-h-[100px]"
          />
        </div>

        {/* Points de vente */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-2">
            Points de vente
          </label>

          {/* Chips existants */}
          {sellingPoints.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {sellingPoints.map((point, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"
                >
                  {point}
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(index)}
                    className="hover:text-emerald-900 transition-colors h-4 w-4 flex items-center justify-center"
                    aria-label={`Supprimer "${point}"`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Ajout point */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPoint}
              onChange={e => setNewPoint(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex: Livraison rapide et gratuite"
              className="flex-1 border border-neutral-200 rounded-md text-sm p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 h-11 md:h-9"
            />
            <button
              type="button"
              onClick={handleAddPoint}
              disabled={!newPoint.trim()}
              className="flex items-center justify-center gap-1 px-3 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors h-11 w-11 md:h-9 md:w-9"
              aria-label="Ajouter un point de vente"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
