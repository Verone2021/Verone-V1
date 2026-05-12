'use client';

/**
 * TechnicalDescriptionCard — Card 2 de l'onglet Descriptions.
 * Edition inline de la description technique (fiche technique site).
 */

import { useState, useCallback } from 'react';

import { Save } from 'lucide-react';

import type { Product, ProductRow } from '../types';

interface TechnicalDescriptionCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function TechnicalDescriptionCard({
  product,
  onProductUpdate,
}: TechnicalDescriptionCardProps) {
  const [technicalDescription, setTechnicalDescription] = useState(
    product.technical_description ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const hasChanges =
    technicalDescription !== (product.technical_description ?? '');

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onProductUpdate({
        technical_description: technicalDescription.trim() || null,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } catch (err) {
      console.error('[TechnicalDescriptionCard] save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [technicalDescription, onProductUpdate]);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Fiche technique
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Apparaît dans la fiche technique du site
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleSave().catch(err =>
              console.error('[TechnicalDescriptionCard]:', err)
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

      {/* Textarea */}
      <div>
        <label className="text-xs text-gray-500 font-medium block mb-1.5">
          Description technique
        </label>
        <textarea
          value={technicalDescription}
          onChange={e => setTechnicalDescription(e.target.value)}
          rows={5}
          placeholder="Matériaux, composition, spécifications techniques, entretien..."
          className="w-full border border-neutral-200 rounded-md text-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-y min-h-[100px]"
        />
      </div>
    </div>
  );
}
