'use client';

import { colors, spacing } from '@verone/ui/design-system';

import type { FormSubmission } from '../types';

type Props = {
  submission: FormSubmission;
};

export function MessageCard({ submission }: Props) {
  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: colors.text.DEFAULT }}
      >
        {submission.subject ?? 'Message'}
      </h2>
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: colors.text.subtle }}
      >
        {submission.message}
      </p>
    </div>
  );
}
