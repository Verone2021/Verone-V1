'use client';

import { ButtonV2, Textarea } from '@verone/ui';
import {
  AlertCircle,
  Clock,
  Edit,
  Save,
  StickyNote,
  User,
  X,
} from 'lucide-react';

import type { NotesSectionData, SourcingProduct } from './types';

interface SourcingProductNotesSectionProps {
  product: SourcingProduct;
  isEditing: boolean;
  isSaving: boolean;
  editedData: NotesSectionData | null;
  error: string | null;
  hasChanges: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdateData: (patch: Partial<NotesSectionData>) => void;
  onSave: () => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function SourcingProductNotesSection({
  product,
  isEditing,
  isSaving,
  editedData,
  error,
  hasChanges,
  onStartEdit,
  onCancelEdit,
  onUpdateData,
  onSave,
  formatDate,
}: SourcingProductNotesSectionProps) {
  return (
    <>
      {/* ZONE NOTES INTERNES */}
      <div className="border-t border-gray-200 pt-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <StickyNote className="h-4 w-4 mr-2" />
                Notes Internes
              </h3>
              <div className="flex space-x-1">
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </ButtonV2>
                <ButtonV2
                  variant="default"
                  size="sm"
                  onClick={() => void onSave()}
                  disabled={isSaving || !hasChanges}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isSaving ? (
                    <span className="animate-spin">&#8987;</span>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </ButtonV2>
              </div>
            </div>

            <Textarea
              value={editedData?.internal_notes ?? ''}
              onChange={e => onUpdateData({ internal_notes: e.target.value })}
              placeholder="Notes internes sur le sourcing de ce produit..."
              rows={4}
              className="resize-none"
            />

            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <StickyNote className="h-4 w-4 mr-2" />
                Notes Internes
              </h3>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={onStartEdit}
                className="text-gray-500 hover:text-black"
              >
                <Edit className="h-4 w-4" />
              </ButtonV2>
            </div>

            {product.internal_notes ? (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {product.internal_notes}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Aucune note interne
              </p>
            )}
          </div>
        )}
      </div>

      {/* CLIENT ASSIGNÉ (lecture seule) */}
      {product.assigned_client && (
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-black">Client assigné</h4>
            </div>
            <p className="text-lg font-semibold text-purple-900">
              {product.assigned_client.name}
              {product.assigned_client.type === 'client'
                ? ' (Client)'
                : ` (${product.assigned_client.type})`}
            </p>
          </div>
        </div>
      )}

      {/* MÉTADONNÉES */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center text-sm text-gray-600 space-x-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Créé le {formatDate(product.created_at)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Modifié le {formatDate(product.updated_at)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
