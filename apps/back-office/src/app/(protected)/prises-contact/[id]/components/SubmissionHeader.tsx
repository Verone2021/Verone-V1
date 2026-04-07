'use client';

import Link from 'next/link';

import { ButtonUnified } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, AlertCircle, Edit, Save, X } from 'lucide-react';

import type { FormSubmission, FormType } from '../types';

const statusOptions = [
  { value: 'new', label: '🆕 Nouveau' },
  { value: 'in_progress', label: '⏳ En cours' },
  { value: 'waiting', label: '⏸️ En attente' },
  { value: 'resolved', label: '✅ Résolu' },
  { value: 'closed', label: '🔒 Fermé' },
  { value: 'spam', label: '🚫 Spam' },
];

const priorityOptions = [
  { value: 'low', label: '🔵 Basse' },
  { value: 'medium', label: '🟡 Moyenne' },
  { value: 'high', label: '🟠 Haute' },
  { value: 'urgent', label: '🔴 URGENT' },
];

type Props = {
  submission: FormSubmission;
  formType: FormType | null;
  editingStatus: boolean;
  editingPriority: boolean;
  newStatus: string;
  newPriority: string;
  saving: boolean;
  setEditingStatus: (v: boolean) => void;
  setEditingPriority: (v: boolean) => void;
  setNewStatus: (v: string) => void;
  setNewPriority: (v: string) => void;
  saveStatus: () => Promise<void>;
  savePriority: () => Promise<void>;
};

export function SubmissionHeader({
  submission,
  formType,
  editingStatus,
  editingPriority,
  newStatus,
  newPriority,
  saving,
  setEditingStatus,
  setEditingPriority,
  setNewStatus,
  setNewPriority,
  saveStatus,
  savePriority,
}: Props) {
  const createdDate = format(new Date(submission.created_at), 'PPPp', {
    locale: fr,
  });

  return (
    <div
      className="border-b"
      style={{
        padding: `${spacing[4]} ${spacing[6]}`,
        borderColor: colors.neutral[200],
      }}
    >
      <Link
        href="/prises-contact"
        className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
        style={{ color: colors.text.subtle }}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: colors.text.DEFAULT }}
          >
            {submission.first_name} {submission.last_name}
          </h1>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            {formType?.label ?? submission.form_type} • {createdDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status editor */}
          {editingStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="px-3 py-1 rounded-md border text-sm"
                style={{ borderColor: colors.neutral[300] }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ButtonUnified
                variant="default"
                size="sm"
                onClick={() => {
                  void saveStatus().catch(error => {
                    console.error(
                      '[SubmissionHeader] Save status failed:',
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
                  setEditingStatus(false);
                  setNewStatus(submission.status);
                }}
              >
                <X className="h-4 w-4" />
              </ButtonUnified>
            </div>
          ) : (
            <ButtonUnified
              variant="secondary"
              size="sm"
              onClick={() => setEditingStatus(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {statusOptions.find(s => s.value === submission.status)?.label ??
                submission.status}
            </ButtonUnified>
          )}

          {/* Priority editor */}
          {editingPriority ? (
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="px-3 py-1 rounded-md border text-sm"
                style={{ borderColor: colors.neutral[300] }}
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ButtonUnified
                variant="default"
                size="sm"
                onClick={() => {
                  void savePriority().catch(error => {
                    console.error(
                      '[SubmissionHeader] Save priority failed:',
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
                  setEditingPriority(false);
                  setNewPriority(submission.priority);
                }}
              >
                <X className="h-4 w-4" />
              </ButtonUnified>
            </div>
          ) : (
            <ButtonUnified
              variant="secondary"
              size="sm"
              onClick={() => setEditingPriority(true)}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {priorityOptions.find(p => p.value === submission.priority)
                ?.label ?? submission.priority}
            </ButtonUnified>
          )}
        </div>
      </div>
    </div>
  );
}
