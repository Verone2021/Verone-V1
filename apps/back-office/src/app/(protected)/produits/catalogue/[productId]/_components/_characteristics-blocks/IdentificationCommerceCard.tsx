'use client';

/**
 * IdentificationCommerceCard — Bloc 3 du dashboard Caractéristiques.
 * Grid 4 cols : Marque / GTIN / État (condition) / Style décoratif.
 * Row full-width : Pièces compatibles (chips multi) + Vidéo URL.
 */

import { useState, useCallback, useRef } from 'react';

import { useInlineEdit } from '@verone/common/hooks';
import { formatStyle } from '@verone/products/components/images';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { Lock, Pencil, X, Check, ExternalLink, Video } from 'lucide-react';

import type { Database } from '@verone/types';

import type { Product, ProductRow } from '../types';

type RoomType = Database['public']['Enums']['room_type'];

const ROOM_LABELS: Record<RoomType, string> = {
  salon: 'Salon',
  salle_a_manger: 'Salle à manger',
  chambre: 'Chambre',
  bureau: 'Bureau',
  bibliotheque: 'Bibliothèque',
  salon_sejour: 'Salon/Séjour',
  cuisine: 'Cuisine',
  salle_de_bain: 'Salle de bain',
  wc: 'WC',
  toilettes: 'Toilettes',
  hall_entree: "Hall d'entrée",
  couloir: 'Couloir',
  cellier: 'Cellier',
  buanderie: 'Buanderie',
  dressing: 'Dressing',
  cave: 'Cave',
  grenier: 'Grenier',
  garage: 'Garage',
  terrasse: 'Terrasse',
  balcon: 'Balcon',
  jardin: 'Jardin',
  veranda: 'Véranda',
  loggia: 'Loggia',
  cour: 'Cour',
  patio: 'Patio',
  salle_de_jeux: 'Salle de jeux',
  salle_de_sport: 'Salle de sport',
  atelier: 'Atelier',
  mezzanine: 'Mezzanine',
  sous_sol: 'Sous-sol',
};

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'used', label: 'Occasion' },
  { value: 'refurbished', label: 'Reconditionné' },
] as const;

interface InlineTextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  mono?: boolean;
  readOnly?: boolean;
  onSave: (value: string) => void;
}

function InlineTextField({
  label,
  value,
  placeholder,
  mono = false,
  readOnly = false,
  onSave,
}: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = useCallback(() => {
    onSave(draft.trim());
    setEditing(false);
  }, [draft, onSave]);

  return (
    <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
        {label}
      </span>
      {readOnly ? (
        <span className="text-xs text-neutral-700">{value || '—'}</span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
              }
            }}
            className={cn('h-6 text-xs px-1.5 flex-1', mono && 'font-mono')}
          />
          <button
            onClick={handleSave}
            className="h-5 w-5 flex items-center justify-center rounded text-green-600 hover:bg-green-50"
            aria-label="Valider"
          >
            <Check className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="h-5 w-5 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
            aria-label="Annuler"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="group flex items-center gap-1 text-left"
        >
          <span
            className={cn(
              'text-xs text-neutral-700 flex-1 truncate',
              mono && 'font-mono',
              !value && 'text-neutral-400 italic'
            )}
          >
            {value.length > 0 ? value : (placeholder ?? '—')}
          </span>
          <Pencil className="h-2.5 w-2.5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
        </button>
      )}
    </div>
  );
}

interface IdentificationCommerceCardProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function IdentificationCommerceCard({
  product,
  onProductUpdate,
}: IdentificationCommerceCardProps) {
  const [videoPreview, setVideoPreview] = useState(false);
  const [roomsEditMode, setRoomsEditMode] = useState(false);
  const [roomsDraft, setRoomsDraft] = useState<RoomType[]>([]);
  const roomsDraftRef = useRef<RoomType[]>([]);

  const { startEdit, updateEditedData, saveChanges, cancelEdit } =
    useInlineEdit({
      productId: product.id,
      onUpdate: data => {
        void onProductUpdate(data as Partial<ProductRow>).catch(err => {
          console.error('[IdentificationCommerceCard] update failed:', err);
        });
      },
    });

  const handleSave = useCallback(
    (field: string, value: string | string[] | null) => {
      startEdit('characteristics_identification', { [field]: value });
      updateEditedData('characteristics_identification', { [field]: value });
      void saveChanges('characteristics_identification').then(ok => {
        if (!ok) cancelEdit('characteristics_identification');
      });
    },
    [startEdit, updateEditedData, saveChanges, cancelEdit]
  );

  // Style : hérité du groupe si variant_group.style existe
  const styleValue = product.variant_group?.style ?? product.style ?? null;
  const styleIsInherited =
    product.variant_group_id != null && product.variant_group?.style != null;
  const styleLabel = styleValue ? formatStyle(styleValue) : null;

  // Pièces compatibles : héritage variant_group.suitable_rooms
  const roomsIsInherited =
    product.variant_group?.suitable_rooms != null &&
    (product.variant_group.suitable_rooms as RoomType[]).length > 0;
  const rooms: RoomType[] = roomsIsInherited
    ? (product.variant_group!.suitable_rooms as RoomType[])
    : (product.suitable_rooms ?? []);

  // Condition actuelle
  const conditionValue = product.condition ?? null;
  const conditionLabel =
    CONDITION_OPTIONS.find(o => o.value === conditionValue)?.label ??
    conditionValue ??
    '—';

  const handleToggleRoomDraft = useCallback((room: RoomType) => {
    setRoomsDraft(prev => {
      const next = prev.includes(room)
        ? prev.filter(r => r !== room)
        : [...prev, room];
      roomsDraftRef.current = next;
      return next;
    });
  }, []);

  const handleRoomsEditStart = useCallback(() => {
    const current: RoomType[] = product.suitable_rooms ?? [];
    setRoomsDraft(current);
    roomsDraftRef.current = current;
    setRoomsEditMode(true);
  }, [product.suitable_rooms]);

  const handleRoomsEditSave = useCallback(() => {
    handleSave('suitable_rooms', roomsDraftRef.current);
    setRoomsEditMode(false);
  }, [handleSave]);

  const handleRoomsEditCancel = useCallback(() => {
    setRoomsEditMode(false);
    setRoomsDraft([]);
    roomsDraftRef.current = [];
  }, []);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium mb-3">
        Identification & Commerce
      </h3>

      {/* Grid 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <InlineTextField
          label="Marque"
          value={product.brand ?? ''}
          placeholder="ex: Cassina"
          onSave={v => handleSave('brand', v || null)}
        />
        <InlineTextField
          label="GTIN / EAN"
          value={product.gtin ?? ''}
          placeholder="0000000000000"
          mono
          onSave={v => handleSave('gtin', v || null)}
        />

        {/* Condition (segmented) */}
        <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
            État
          </span>
          <div className="flex gap-1 flex-wrap">
            {CONDITION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() =>
                  handleSave(
                    'condition',
                    conditionValue === opt.value ? null : opt.value
                  )
                }
                className={cn(
                  'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                  conditionValue === opt.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style (readonly si hérité) */}
        <div className="bg-neutral-50 rounded border border-neutral-200 p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
              Style décoratif
            </span>
            {styleIsInherited && (
              <Lock className="h-2.5 w-2.5 text-blue-400 flex-shrink-0" />
            )}
          </div>
          {styleIsInherited ? (
            <span className="text-xs text-neutral-700">
              {styleLabel ?? '—'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {COLLECTION_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() =>
                    handleSave(
                      'style',
                      styleValue === opt.value ? null : opt.value
                    )
                  }
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                    styleValue === opt.value
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {styleIsInherited && product.variant_group_id && (
            <a
              href={`/produits/catalogue/variantes/${product.variant_group_id}`}
              className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <Lock className="h-2 w-2" />
              Hérité du groupe
            </a>
          )}
        </div>
      </div>

      {/* Pièces compatibles */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
            Pièces compatibles
          </span>
          {roomsIsInherited && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-[10px] text-blue-700">
              <Lock className="h-2.5 w-2.5" />
              Hérité du groupe
            </span>
          )}
          {!roomsIsInherited && !roomsEditMode && (
            <button
              onClick={handleRoomsEditStart}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 transition-colors"
            >
              <Pencil className="h-2.5 w-2.5" />
              Modifier
            </button>
          )}
        </div>

        {/* Mode VIEW : chips readonly des pièces sélectionnées uniquement */}
        {!roomsEditMode && (
          <div className="flex flex-wrap gap-1.5">
            {rooms.length > 0 ? (
              rooms.map(room => (
                <span
                  key={room}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border',
                    roomsIsInherited
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  )}
                >
                  {ROOM_LABELS[room]}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-neutral-400 italic">
                Aucune pièce sélectionnée
              </span>
            )}
          </div>
        )}

        {/* Mode EDIT : tous les 30 rooms toggleables + actions */}
        {roomsEditMode && (
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(ROOM_LABELS).map(([key, label]) => {
                const room = key as RoomType;
                const isActive = roomsDraft.includes(room);
                return (
                  <button
                    key={room}
                    onClick={() => handleToggleRoomDraft(room)}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                      isActive
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRoomsEditSave}
                className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors"
              >
                <Check className="h-2.5 w-2.5" />
                Enregistrer
              </button>
              <button
                onClick={handleRoomsEditCancel}
                className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 text-neutral-600 text-[10px] hover:bg-neutral-50 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vidéo URL */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
            Vidéo produit
          </span>
          {product.video_url && (
            <button
              onClick={() => setVideoPreview(v => !v)}
              className="flex items-center gap-1 text-[10px] text-indigo-600 hover:underline"
            >
              <Video className="h-3 w-3" />
              {videoPreview ? 'Masquer' : 'Aperçu'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <InlineTextField
              label=""
              value={product.video_url ?? ''}
              placeholder="https://youtu.be/..."
              onSave={v => handleSave('video_url', v || null)}
            />
          </div>
          {product.video_url && (
            <a
              href={product.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-700"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {videoPreview && product.video_url && (
          <div className="mt-2 p-2 bg-neutral-50 rounded border border-neutral-200 text-[10px] text-neutral-500 italic">
            Aperçu vidéo non disponible dans l&apos;éditeur — ouvrir le lien
            externe.
          </div>
        )}
      </div>

      {/* Affichage condition label (pour l'info) */}
      {conditionLabel && conditionLabel !== '—' && (
        <p className="mt-3 text-[10px] text-neutral-400">
          État actuel : {conditionLabel}
        </p>
      )}
    </div>
  );
}
