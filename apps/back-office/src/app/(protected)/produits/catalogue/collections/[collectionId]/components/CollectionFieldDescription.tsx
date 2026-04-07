'use client';

import { useState, useCallback } from 'react';

import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Edit3 } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldDescription({
  collection,
  collectionId,
  updateCollection,
  refetch,
  toast,
}: CollectionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setEdited(collection.description ?? '');
    setEditing(true);
  }, [collection.description]);

  const handleSave = useCallback(async () => {
    if (edited === collection.description) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const success = await updateCollection({
      id: collectionId,
      description: edited ?? undefined,
    });

    if (success) {
      toast({
        title: 'Description modifiée',
        description: 'La description a été mise à jour',
      });
      await refetch();
      setEditing(false);
    }
    setSaving(false);
  }, [
    edited,
    collection.description,
    collectionId,
    updateCollection,
    toast,
    refetch,
  ]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEdited('');
  }, []);

  return (
    <div className="md:col-span-3">
      <Label className="text-sm font-medium text-gray-700 block mb-2">
        Description
      </Label>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={edited}
            onChange={e => setEdited(e.target.value)}
            onBlur={() => {
              void handleSave().catch(error => {
                console.error('[Collections] Save description failed:', error);
              });
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={saving}
            className="border-black focus:ring-black resize-none"
            rows={2}
            autoFocus
          />
          {saving && (
            <div className="text-xs text-gray-500">Enregistrement...</div>
          )}
          <p className="text-xs text-gray-500">{edited.length} caractères</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 group">
          <p className="text-sm text-gray-600 flex-1">
            {collection.description ?? (
              <span className="text-gray-400 italic">Aucune description</span>
            )}
          </p>
          <button
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
            title="Modifier la description"
          >
            <Edit3 className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
