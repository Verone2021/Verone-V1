'use client';

import { useState, useCallback } from 'react';

import { COLLECTION_STYLE_OPTIONS, type CollectionStyle } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import { cn } from '@verone/utils';
import { Edit3, X } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldStyle({
  collection,
  collectionId,
  updateCollection,
  refetch,
  toast,
}: CollectionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<CollectionStyle | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setEdited((collection.style ?? null) as CollectionStyle | null);
    setEditing(true);
  }, [collection.style]);

  const handleSelect = useCallback(
    async (style: CollectionStyle | null) => {
      setEdited(style);
      setSaving(true);

      const success = await updateCollection({
        id: collectionId,
        style: style ?? undefined,
      });

      if (success) {
        toast({
          title: 'Style modifié',
          description: 'Le style a été mis à jour',
        });
        await refetch();
        setEditing(false);
      }
      setSaving(false);
    },
    [collectionId, updateCollection, toast, refetch]
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEdited(null);
  }, []);

  return (
    <div className="md:col-span-2">
      <Label className="text-sm font-medium text-gray-700 block mb-2">
        Style décoratif
      </Label>
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COLLECTION_STYLE_OPTIONS.map(styleOption => (
              <button
                key={styleOption.value}
                type="button"
                onClick={() => {
                  void handleSelect(
                    edited === styleOption.value ? null : styleOption.value
                  ).catch(error => {
                    console.error('[Collections] Select style failed:', error);
                  });
                }}
                disabled={saving}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-center transition-all',
                  edited === styleOption.value
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                )}
              >
                <div className="text-2xl mb-1">
                  {styleOption.value === 'minimaliste' && '⬜'}
                  {styleOption.value === 'contemporain' && '🏙️'}
                  {styleOption.value === 'moderne' && '🚀'}
                  {styleOption.value === 'scandinave' && '🌲'}
                  {styleOption.value === 'industriel' && '⚙️'}
                  {styleOption.value === 'classique' && '👑'}
                  {styleOption.value === 'boheme' && '🌺'}
                  {styleOption.value === 'art_deco' && '💎'}
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-xs">{styleOption.label}</div>
                  <div
                    className={cn(
                      'text-xs',
                      edited === styleOption.value
                        ? 'text-gray-200'
                        : 'text-gray-500'
                    )}
                  >
                    {styleOption.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {saving && (
            <div className="text-xs text-gray-500">Enregistrement...</div>
          )}
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-3 w-3 mr-1" />
            Annuler
          </ButtonV2>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          {collection.style ? (
            <Badge variant="outline" className="px-3 py-1">
              <span className="mr-2">
                {collection.style === 'minimaliste' && '⬜'}
                {collection.style === 'contemporain' && '🏙️'}
                {collection.style === 'moderne' && '🚀'}
                {collection.style === 'scandinave' && '🌲'}
                {collection.style === 'industriel' && '⚙️'}
                {collection.style === 'classique' && '👑'}
                {collection.style === 'boheme' && '🌺'}
                {collection.style === 'art_deco' && '💎'}
              </span>
              {
                COLLECTION_STYLE_OPTIONS.find(s => s.value === collection.style)
                  ?.label
              }
            </Badge>
          ) : (
            <span className="text-sm text-gray-400 italic">
              Aucun style sélectionné
            </span>
          )}
          <button
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            title="Modifier le style"
          >
            <Edit3 className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
