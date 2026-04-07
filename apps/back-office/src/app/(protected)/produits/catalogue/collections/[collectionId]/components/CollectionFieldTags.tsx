'use client';

import { useState, useCallback } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Edit3, Plus, Tag, X } from 'lucide-react';

import type { CollectionFieldProps } from './types';

export function CollectionFieldTags({
  collection,
  collectionId,
  updateCollection,
  refetch,
  toast,
}: CollectionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setEdited(collection.theme_tags ?? []);
    setEditing(true);
  }, [collection.theme_tags]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !edited.includes(newTag.trim())) {
      setEdited([...edited, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, edited]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      setEdited(edited.filter(t => t !== tagToRemove));
    },
    [edited]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);

    const success = await updateCollection({
      id: collectionId,
      theme_tags: edited,
    });

    if (success) {
      toast({
        title: 'Tags modifiés',
        description: 'Les tags ont été mis à jour',
      });
      await refetch();
      setEditing(false);
    }
    setSaving(false);
  }, [edited, collectionId, updateCollection, toast, refetch]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEdited([]);
    setNewTag('');
  }, []);

  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 block mb-2">
        Tags thématiques
      </Label>
      {editing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ex: Eco-responsable, Petit espace..."
            />
            <ButtonV2
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </ButtonV2>
          </div>
          {edited && edited.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {edited.map(tag => (
                <Badge key={tag} variant="outline" className="pl-2 pr-1">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {saving && (
            <div className="text-xs text-gray-500">Enregistrement...</div>
          )}
          <div className="flex gap-2">
            <ButtonV2
              size="sm"
              onClick={() => {
                void handleSave().catch(error => {
                  console.error('[Collections] Save tags failed:', error);
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
            {collection.theme_tags && collection.theme_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {collection.theme_tags.map(tag => (
                  <Badge key={tag} variant="outline" className="pl-2 pr-2">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">
                Aucun tag défini
              </span>
            )}
          </div>
          <button
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
            title="Modifier les tags"
          >
            <Edit3 className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
