'use client';

import { colors, spacing } from '@verone/ui/design-system';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { FormSubmission, FormType } from '../types';

type Props = {
  submission: FormSubmission;
  formType: FormType | null;
};

export function MetadataCard({ submission, formType }: Props) {
  const timeAgo = formatDistanceToNow(new Date(submission.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: colors.text.DEFAULT }}
      >
        Métadonnées
      </h3>

      <div className="space-y-3">
        <div>
          <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
            Source
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: colors.text.DEFAULT }}
          >
            {submission.source}
          </p>
        </div>

        <div>
          <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
            Créé
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: colors.text.DEFAULT }}
          >
            {timeAgo}
          </p>
        </div>

        {formType?.sla_hours && submission.sla_deadline && (
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
              Deadline SLA ({formType.sla_hours}h)
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: colors.text.DEFAULT }}
            >
              {format(new Date(submission.sla_deadline), 'PPp', { locale: fr })}
            </p>
          </div>
        )}

        {submission.metadata && Object.keys(submission.metadata).length > 0 && (
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
              Données additionnelles
            </p>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(submission.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
