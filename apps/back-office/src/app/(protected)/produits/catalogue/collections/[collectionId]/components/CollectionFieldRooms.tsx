'use client';

import { useState, useCallback } from 'react';

import type { RoomType } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import { RoomMultiSelect } from '@verone/ui';
import { Edit3, X } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldRooms({
  collection,
  collectionId,
  updateCollection,
  refetch,
  toast,
}: CollectionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setEdited(collection.suitable_rooms ?? []);
    setEditing(true);
  }, [collection.suitable_rooms]);

  const handleSave = useCallback(async () => {
    setSaving(true);

    const success = await updateCollection({
      id: collectionId,
      suitable_rooms: edited,
    });

    if (success) {
      toast({
        title: 'Pièces modifiées',
        description: 'Les pièces compatibles ont été mises à jour',
      });
      await refetch();
      setEditing(false);
    }
    setSaving(false);
  }, [edited, collectionId, updateCollection, toast, refetch]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEdited([]);
  }, []);

  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 block mb-2">
        Pièces compatibles
      </Label>
      {editing ? (
        <div className="space-y-3">
          <RoomMultiSelect
            value={(edited ?? []) as RoomType[]}
            onChange={rooms => setEdited(rooms)}
            placeholder="Sélectionner les pièces compatibles..."
            className="w-full"
          />
          {edited && edited.length > 0 && (
            <p className="text-xs text-gray-600">
              {edited.length} pièce
              {edited.length > 1 ? 's' : ''} sélectionnée
              {edited.length > 1 ? 's' : ''}
            </p>
          )}
          {saving && (
            <div className="text-xs text-gray-500">Enregistrement...</div>
          )}
          <div className="flex gap-2">
            <ButtonV2
              size="sm"
              onClick={() => {
                void handleSave().catch(error => {
                  console.error('[Collections] Save rooms failed:', error);
                });
              }}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800"
            >
              Enregistrer
            </ButtonV2>
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
        </div>
      ) : (
        <div className="flex items-start gap-2 group">
          <div className="flex-1">
            {collection.suitable_rooms &&
            collection.suitable_rooms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {collection.suitable_rooms.map(room => (
                  <Badge key={room} variant="secondary">
                    {room}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">
                Aucune pièce sélectionnée
              </span>
            )}
          </div>
          <button
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
            title="Modifier les pièces"
          >
            <Edit3 className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
