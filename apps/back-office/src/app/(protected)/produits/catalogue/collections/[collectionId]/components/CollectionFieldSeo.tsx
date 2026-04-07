'use client';

import { useState, useCallback } from 'react';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Edit3 } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldSeo({
  collection,
  collectionId,
  updateCollection,
  refetch,
  toast,
}: CollectionFieldProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  const [editingDesc, setEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  // --- Meta title ---
  const handleStartTitle = useCallback(() => {
    setEditedTitle(collection.meta_title ?? '');
    setEditingTitle(true);
  }, [collection.meta_title]);

  const handleSaveTitle = useCallback(async () => {
    setSavingTitle(true);

    const success = await updateCollection({
      id: collectionId,
      description: editedTitle ?? undefined,
    });

    if (success) {
      toast({
        title: 'Meta title modifié',
        description: 'Le titre SEO a été mis à jour',
      });
      await refetch();
      setEditingTitle(false);
    }
    setSavingTitle(false);
  }, [editedTitle, collectionId, updateCollection, toast, refetch]);

  const handleCancelTitle = useCallback(() => {
    setEditingTitle(false);
    setEditedTitle('');
  }, []);

  // --- Meta description ---
  const handleStartDesc = useCallback(() => {
    setEditedDesc(collection.meta_description ?? '');
    setEditingDesc(true);
  }, [collection.meta_description]);

  const handleSaveDesc = useCallback(async () => {
    setSavingDesc(true);

    const success = await updateCollection({
      id: collectionId,
      description: editedDesc ?? undefined,
    });

    if (success) {
      toast({
        title: 'Meta description modifiée',
        description: 'La description SEO a été mise à jour',
      });
      await refetch();
      setEditingDesc(false);
    }
    setSavingDesc(false);
  }, [editedDesc, collectionId, updateCollection, toast, refetch]);

  const handleCancelDesc = useCallback(() => {
    setEditingDesc(false);
    setEditedDesc('');
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
      {/* Meta title */}
      <div>
        <Label className="text-sm font-medium text-gray-700 block mb-2">
          Titre SEO
        </Label>
        {editingTitle ? (
          <div className="space-y-2">
            <Input
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onBlur={() => {
                void handleSaveTitle().catch(error => {
                  console.error('[Collections] Save meta title failed:', error);
                });
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  void handleSaveTitle().catch(error => {
                    console.error(
                      '[Collections] Save meta title failed:',
                      error
                    );
                  });
                }
                if (e.key === 'Escape') handleCancelTitle();
              }}
              disabled={savingTitle}
              maxLength={60}
              className="border-black focus:ring-black"
              placeholder="Titre optimisé pour les moteurs de recherche"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              {editedTitle.length}/60 caractères
            </p>
            {savingTitle && (
              <div className="text-xs text-gray-500">Enregistrement...</div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2 group">
            <p className="text-sm text-gray-600 flex-1">
              {collection.meta_title ?? (
                <span className="text-gray-400 italic">Non défini</span>
              )}
            </p>
            <button
              onClick={handleStartTitle}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
              title="Modifier le titre SEO"
            >
              <Edit3 className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Meta description */}
      <div>
        <Label className="text-sm font-medium text-gray-700 block mb-2">
          Description SEO
        </Label>
        {editingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={editedDesc}
              onChange={e => setEditedDesc(e.target.value)}
              onBlur={() => {
                void handleSaveDesc().catch(error => {
                  console.error(
                    '[Collections] Save meta description failed:',
                    error
                  );
                });
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') handleCancelDesc();
              }}
              disabled={savingDesc}
              maxLength={160}
              className="border-black focus:ring-black resize-none"
              placeholder="Description optimisée pour les moteurs de recherche"
              rows={2}
              autoFocus
            />
            <p className="text-xs text-gray-500">
              {editedDesc.length}/160 caractères
            </p>
            {savingDesc && (
              <div className="text-xs text-gray-500">Enregistrement...</div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2 group">
            <p className="text-sm text-gray-600 flex-1">
              {collection.meta_description ?? (
                <span className="text-gray-400 italic">Non définie</span>
              )}
            </p>
            <button
              onClick={handleStartDesc}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
              title="Modifier la description SEO"
            >
              <Edit3 className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
