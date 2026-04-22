'use client';

/**
 * AttributesVariantesCard — Bloc 1 du dashboard Caractéristiques.
 * Affiche les 5 attributs prédéfinis + attributs custom du JSONB variant_attributes.
 * Édition inline par attribut (pencil on hover).
 * Chip "Hérité du groupe" si variant_group_id.
 */

import { useState, useCallback, useMemo } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { VARIANT_ATTRIBUTE_LABELS } from '@verone/products/components/images';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Lock, Pencil, Plus, X, Check } from 'lucide-react';

import type { Product, ProductRow } from '../types';

const PREDEFINED_KEYS = ['color', 'material', 'finish', 'pattern'] as const;

interface AttributesVariantesCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

interface AttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  onSave: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  isCustom?: boolean;
}

function AttributeRow({
  attrKey,
  label,
  value,
  onSave,
  onDelete,
  isCustom = false,
}: AttributeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = useCallback(() => {
    onSave(attrKey, draft.trim());
    setEditing(false);
  }, [attrKey, draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') {
        setDraft(value);
        setEditing(false);
      }
    },
    [handleSave, value]
  );

  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-28 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1">
          <Input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs px-1.5 flex-1"
          />
          <button
            onClick={handleSave}
            className="h-6 w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={cn(
              'flex-1 text-xs truncate tabular-nums',
              value ? 'text-neutral-900' : 'text-neutral-400 italic'
            )}
          >
            {value || '—'}
          </span>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 transition-opacity"
            aria-label={`Modifier ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
          {isCustom && onDelete && (
            <button
              onClick={() => onDelete(attrKey)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition-opacity"
              aria-label={`Supprimer ${label}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AttributesVariantesCard({
  product,
  onProductUpdate,
}: AttributesVariantesCardProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const variantAttrs = useMemo(
    () => (product.variant_attributes as Record<string, string> | null) ?? {},
    [product.variant_attributes]
  );

  const { startEdit, updateEditedData, saveChanges, cancelEdit } =
    useInlineEdit({
      productId: product.id,
      onUpdate: data => {
        void onProductUpdate(data as Partial<ProductRow>).catch(err => {
          console.error('[AttributesVariantesCard] update failed:', err);
        });
      },
    });

  const handleSaveAttr = useCallback(
    (key: string, value: string) => {
      const updated = { ...variantAttrs };
      if (value) {
        updated[key] = value;
      } else {
        delete updated[key];
      }
      startEdit('characteristics_attributes', {
        variant_attributes: updated,
      });
      updateEditedData('characteristics_attributes', {
        variant_attributes: updated,
      });
      void saveChanges('characteristics_attributes').then(ok => {
        if (!ok) cancelEdit('characteristics_attributes');
      });
    },
    [variantAttrs, startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  const handleDeleteAttr = useCallback(
    (key: string) => {
      const updated = { ...variantAttrs };
      delete updated[key];
      startEdit('characteristics_attributes', {
        variant_attributes: updated,
      });
      updateEditedData('characteristics_attributes', {
        variant_attributes: updated,
      });
      void saveChanges('characteristics_attributes').then(ok => {
        if (!ok) cancelEdit('characteristics_attributes');
      });
    },
    [variantAttrs, startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  const handleAddAttr = useCallback(() => {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k || !v) return;
    const updated = { ...variantAttrs, [k]: v };
    startEdit('characteristics_attributes', {
      variant_attributes: updated,
    });
    updateEditedData('characteristics_attributes', {
      variant_attributes: updated,
    });
    void saveChanges('characteristics_attributes').then(ok => {
      if (ok) {
        setNewKey('');
        setNewValue('');
        setShowAddRow(false);
      } else {
        cancelEdit('characteristics_attributes');
      }
    });
  }, [
    newKey,
    newValue,
    variantAttrs,
    startEdit,
    updateEditedData,
    saveChanges,
    cancelEdit,
  ]);

  // Custom attrs = tout ce qui n'est pas predefined
  const predefinedSet = new Set(PREDEFINED_KEYS as readonly string[]);
  const customAttrs = Object.entries(variantAttrs).filter(
    ([k]) => !predefinedSet.has(k)
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
          Attributs variantes
        </h3>
        {product.variant_group_id && (
          <a
            href={`/produits/catalogue/variantes/${product.variant_group_id}`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Lock className="h-2.5 w-2.5" />
            Hérité du groupe · voir groupe
          </a>
        )}
      </div>

      {/* Attributs prédéfinis */}
      <div className="mb-2">
        {PREDEFINED_KEYS.map(key => {
          const meta = VARIANT_ATTRIBUTE_LABELS[key];
          const label = meta?.label ?? key;
          const value = variantAttrs[key] ?? '';
          return (
            <AttributeRow
              key={key}
              attrKey={key}
              label={label}
              value={value}
              onSave={handleSaveAttr}
            />
          );
        })}
      </div>

      {/* Attributs custom */}
      {customAttrs.length > 0 && (
        <div className="mb-2">
          {customAttrs.map(([k, v]) => (
            <AttributeRow
              key={k}
              attrKey={k}
              label={k}
              value={v}
              onSave={handleSaveAttr}
              onDelete={handleDeleteAttr}
              isCustom
            />
          ))}
        </div>
      )}

      {/* Ajouter attribut */}
      {showAddRow ? (
        <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100">
          <Input
            autoFocus
            placeholder="Clé"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            className="h-6 text-xs px-1.5 w-24"
          />
          <Input
            placeholder="Valeur"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddAttr();
              if (e.key === 'Escape') {
                setShowAddRow(false);
                setNewKey('');
                setNewValue('');
              }
            }}
            className="h-6 text-xs px-1.5 flex-1"
          />
          <button
            onClick={handleAddAttr}
            className="h-6 w-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Ajouter"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setShowAddRow(false);
              setNewKey('');
              setNewValue('');
            }}
            className="h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddRow(true)}
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 pt-2 border-t border-neutral-100 w-full transition-colors"
        >
          <Plus className="h-3 w-3" />
          Ajouter attribut
        </button>
      )}
    </div>
  );
}
