'use client';

import { colors, spacing } from '@verone/ui/design-system';
import { Mail, Phone, Building2, User } from 'lucide-react';

import type { FormSubmission } from '../types';

type Props = {
  submission: FormSubmission;
};

export function ContactInfoCard({ submission }: Props) {
  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text.DEFAULT }}
      >
        Informations de contact
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Mail
            className="h-5 w-5 mt-0.5"
            style={{ color: colors.text.muted }}
          />
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
              Email
            </p>
            <a
              href={`mailto:${submission.email}`}
              className="text-sm font-medium hover:underline"
              style={{ color: colors.primary[600] }}
            >
              {submission.email}
            </a>
          </div>
        </div>

        {submission.phone && (
          <div className="flex items-start gap-3">
            <Phone
              className="h-5 w-5 mt-0.5"
              style={{ color: colors.text.muted }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
                Téléphone
              </p>
              <a
                href={`tel:${submission.phone}`}
                className="text-sm font-medium hover:underline"
                style={{ color: colors.primary[600] }}
              >
                {submission.phone}
              </a>
            </div>
          </div>
        )}

        {submission.company_name && (
          <div className="flex items-start gap-3">
            <Building2
              className="h-5 w-5 mt-0.5"
              style={{ color: colors.text.muted }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
                Entreprise
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: colors.text.DEFAULT }}
              >
                {submission.company_name}
              </p>
            </div>
          </div>
        )}

        {submission.role && (
          <div className="flex items-start gap-3">
            <User
              className="h-5 w-5 mt-0.5"
              style={{ color: colors.text.muted }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
                Fonction
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: colors.text.DEFAULT }}
              >
                {submission.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
