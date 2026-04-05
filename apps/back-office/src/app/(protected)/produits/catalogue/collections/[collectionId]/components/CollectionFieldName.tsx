'use client';

import { useState, useCallback } from 'react';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Edit3 } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldName({
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
    setEdited(collection.name ?? '');
    setEditing(true);
  }, [collection.name]);

  const handleSave = useCallback(async () => {
    if (!edited.trim() || edited === collection.name) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const success = await updateCollection({
      id: collectionId,
      name: edited.trim(),
    });

    if (success) {
      toast({ title: 'Nom modifié', description: 'Le nom a été mis à jour' });
      await refetch();
      setEditing(false);
    }
    setSaving(false);
  }, [edited, collection.name, collectionId, updateCollection, toast, refetch]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEdited('');
  }, []);

  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 block mb-2">
        Nom de la collection
      </Label>
      {editing ? (
        <div className="space-y-2">
          <Input
            type="text"
            value={edited}
            onChange={e => setEdited(e.target.value)}
            onBlur={() => {
              void handleSave().catch(error => {
                console.error('[Collections] Save name failed:', error);
              });
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                void handleSave().catch(error => {
                  console.error('[Collections] Save name failed:', error);
                });
              }
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={saving}
            className="border-black focus:ring-black"
            autoFocus
          />
          {saving && (
            <div className="text-xs text-gray-500">Enregistrement...</div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-sm text-gray-900">{collection.name}</p>
          <button
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            title="Modifier le nom"
          >
            <Edit3 className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
