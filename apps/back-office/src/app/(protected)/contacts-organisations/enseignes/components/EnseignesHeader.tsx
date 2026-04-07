'use client';

import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { ArrowLeft, Plus } from 'lucide-react';

interface EnseignesHeaderProps {
  onCreateClick: () => void;
}

export function EnseignesHeader({ onCreateClick }: EnseignesHeaderProps) {
  return (
    <div
      className="flex justify-between items-start"
      style={{ marginBottom: spacing[6] }}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/contacts-organisations">
            <ButtonV2 variant="ghost" size="sm" icon={ArrowLeft}>
              Organisations
            </ButtonV2>
          </Link>
        </div>
        <h1
          className="text-3xl font-semibold"
          style={{ color: colors.text.DEFAULT }}
        >
          Enseignes
        </h1>
        <p className="mt-2" style={{ color: colors.text.subtle }}>
          Gestion des enseignes et groupes de franchises
        </p>
      </div>
      <ButtonV2 variant="primary" onClick={onCreateClick} icon={Plus}>
        Nouvelle Enseigne
      </ButtonV2>
    </div>
  );
}
