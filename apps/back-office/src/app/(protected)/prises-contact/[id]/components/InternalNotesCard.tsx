'use client';

import { ButtonUnified } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { Edit, Save } from 'lucide-react';

import type { FormSubmission } from '../types';

type Props = {
  submission: FormSubmission;
  editingNotes: boolean;
  newNotes: string;
  saving: boolean;
  setEditingNotes: (v: boolean) => void;
  setNewNotes: (v: string) => void;
  saveNotes: () => Promise<void>;
};

export function InternalNotesCard({
  submission,
  editingNotes,
  newNotes,
  saving,
  setEditingNotes,
  setNewNotes,
  saveNotes,
}: Props) {
  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: colors.text.DEFAULT }}
        >
          Notes internes
        </h2>
        {!editingNotes && (
          <ButtonUnified
            variant="ghost"
            size="sm"
            onClick={() => setEditingNotes(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </ButtonUnified>
        )}
      </div>

      {editingNotes ? (
        <div className="space-y-3">
          <textarea
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-md border text-sm"
            style={{ borderColor: colors.neutral[300] }}
            placeholder="Ajoutez des notes internes..."
          />
          <div className="flex items-center gap-2">
            <ButtonUnified
              variant="default"
              size="sm"
              onClick={() => {
                void saveNotes().catch(error => {
                  console.error(
                    '[InternalNotesCard] Save notes failed:',
                    error
                  );
                });
              }}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonUnified>
            <ButtonUnified
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingNotes(false);
                setNewNotes(submission.internal_notes ?? '');
              }}
            >
              Annuler
            </ButtonUnified>
          </div>
        </div>
      ) : (
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: colors.text.subtle }}
        >
          {submission.internal_notes ?? 'Aucune note'}
        </p>
      )}
    </div>
  );
}
