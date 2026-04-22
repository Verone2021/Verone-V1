'use client';

/**
 * AttributesVariantesCard — Bloc 1 du dashboard Caractéristiques.
 * Affiche les attributs prédéfinis + attributs custom du JSONB variant_attributes.
 * Édition inline : couleur = DynamicColorSelector, autres = AttributeSelect + custom.
 */

import { useState, useCallback, useMemo } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { VARIANT_ATTRIBUTE_LABELS } from '@verone/products/components/images';
import { MATERIAL_OPTIONS, COLLECTION_STYLE_OPTIONS } from '@verone/types';
import { Input } from '@verone/ui';
import { DynamicColorSelector } from '@verone/ui-business';
import { cn } from '@verone/utils';
import { Lock, Pencil, Plus, X, Check } from 'lucide-react';

import type { Product, ProductRow } from '../types';
import { AttributeSelect } from './AttributeSelect';
import type { AttributeSelectOption } from './AttributeSelect';

// Attributs prédéfinis avec configuration de leur sélecteur
const PREDEFINED_KEYS = [
  'color',
  'color_secondary',
  'material',
  'material_secondary',
  'finish',
  'pattern',
  'style',
] as const;

type PredefinedKey = (typeof PREDEFINED_KEYS)[number];

const FINISH_OPTIONS: AttributeSelectOption[] = [
  { value: 'mat', label: 'Mat' },
  { value: 'brillant', label: 'Brillant' },
  { value: 'satine', label: 'Satiné' },
  { value: 'brosse', label: 'Brossé' },
  { value: 'poli', label: 'Poli' },
  { value: 'texture', label: 'Texturé' },
  { value: 'vernis', label: 'Vernis' },
  { value: 'laque', label: 'Laqué' },
];

const PATTERN_OPTIONS: AttributeSelectOption[] = [
  { value: 'uni', label: 'Uni' },
  { value: 'raye', label: 'Rayé' },
  { value: 'carreaux', label: 'Carreaux' },
  { value: 'fleuri', label: 'Fleuri' },
  { value: 'geometrique', label: 'Géométrique' },
  { value: 'abstrait', label: 'Abstrait' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'moderne', label: 'Moderne' },
  { value: 'classique', label: 'Classique' },
  { value: 'rustique', label: 'Rustique' },
];

const STYLE_OPTIONS: AttributeSelectOption[] = COLLECTION_STYLE_OPTIONS.map(
  o => ({ value: o.value, label: o.label })
);

const MATERIAL_SELECT_OPTIONS: AttributeSelectOption[] = MATERIAL_OPTIONS.map(
  o => ({ value: o.value, label: o.label })
);

interface AttributesVariantesCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

// ——— Composant AttributeRow pour les attributs custom (texte libre) ———

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
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
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

// ——— Composant pour les attributs couleur (DynamicColorSelector) ———

interface ColorAttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  onSave: (key: string, value: string) => void;
}

function ColorAttributeRow({
  attrKey,
  label,
  value,
  onSave,
}: ColorAttributeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleConfirm = useCallback(() => {
    onSave(attrKey, draft);
    setEditing(false);
  }, [attrKey, draft, onSave]);

  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <DynamicColorSelector value={draft} onChange={setDraft} />
          </div>
          <button
            onClick={handleConfirm}
            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={cn(
              'flex-1 text-xs truncate',
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
        </div>
      )}
    </div>
  );
}

// ——— Composant pour les attributs avec select ———

interface SelectAttributeRowProps {
  attrKey: string;
  label: string;
  value: string;
  options: AttributeSelectOption[];
  allowCustom?: boolean;
  onSave: (key: string, value: string) => void;
}

function SelectAttributeRow({
  attrKey,
  label,
  value,
  options,
  allowCustom = false,
  onSave,
}: SelectAttributeRowProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="w-32 flex-shrink-0 text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <AttributeSelect
          value={value}
          onChange={v => onSave(attrKey, v)}
          options={options}
          allowCustom={allowCustom}
        />
      </div>
    </div>
  );
}

// ——— Configuration des attributs prédéfinis ———

type AttrConfig =
  | { type: 'color' }
  | { type: 'select'; options: AttributeSelectOption[]; allowCustom: boolean };

const PREDEFINED_CONFIG: Record<PredefinedKey, AttrConfig> = {
  color: { type: 'color' },
  color_secondary: { type: 'color' },
  material: {
    type: 'select',
    options: MATERIAL_SELECT_OPTIONS,
    allowCustom: true,
  },
  material_secondary: {
    type: 'select',
    options: MATERIAL_SELECT_OPTIONS,
    allowCustom: true,
  },
  finish: { type: 'select', options: FINISH_OPTIONS, allowCustom: true },
  pattern: { type: 'select', options: PATTERN_OPTIONS, allowCustom: true },
  style: { type: 'select', options: STYLE_OPTIONS, allowCustom: false },
};

const PREDEFINED_LABELS: Record<PredefinedKey, string> = {
  color: 'Couleur',
  color_secondary: 'Couleur secondaire',
  material: 'Matériau',
  material_secondary: 'Matériau second.',
  finish: 'Finition',
  pattern: 'Motif',
  style: 'Style',
};

// ——— Composant principal ———

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

  // Custom attrs = tout ce qui n'est pas prédéfini
  const predefinedSet = new Set(PREDEFINED_KEYS as readonly string[]);
  const customAttrs = Object.entries(variantAttrs).filter(
    ([k]) => !predefinedSet.has(k)
  );

  // Attributs prédéfinis à afficher (on affiche tous même si vide)
  const predefinedEntries = PREDEFINED_KEYS.map(key => ({
    key,
    label:
      VARIANT_ATTRIBUTE_LABELS[key]?.label ?? PREDEFINED_LABELS[key] ?? key,
    value: variantAttrs[key] ?? '',
    config: PREDEFINED_CONFIG[key],
  }));

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

      {/* Attributs prédéfinis avec sélecteurs intelligents */}
      <div className="mb-2">
        {predefinedEntries.map(({ key, label, value, config }) => {
          if (config.type === 'color') {
            return (
              <ColorAttributeRow
                key={key}
                attrKey={key}
                label={label}
                value={value}
                onSave={handleSaveAttr}
              />
            );
          }
          return (
            <SelectAttributeRow
              key={key}
              attrKey={key}
              label={label}
              value={value}
              options={config.options}
              allowCustom={config.allowCustom}
              onSave={handleSaveAttr}
            />
          );
        })}
      </div>

      {/* Attributs custom (texte libre) */}
      {customAttrs.length > 0 && (
        <div className="mb-2 pt-2 border-t border-neutral-100">
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

      {/* Ajouter attribut custom */}
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
          Ajouter attribut personnalisé
        </button>
      )}
    </div>
  );
}
