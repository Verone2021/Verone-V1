'use client';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { ArrowLeft, Plus } from 'lucide-react';

interface TypeInfo {
  title: string;
  description: string;
  badgeText: string | null;
}

interface CustomerPageHeaderProps {
  typeInfo: TypeInfo;
  onCreateCustomer: () => void;
}

export function CustomerPageHeader({
  typeInfo,
  onCreateCustomer,
}: CustomerPageHeaderProps) {
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
          {typeInfo.title}
        </h1>
        <p className="mt-2" style={{ color: colors.text.subtle }}>
          {typeInfo.description}
        </p>
        {typeInfo.badgeText && (
          <div className="mt-2">
            <Badge
              variant="outline"
              style={{
                backgroundColor: colors.primary[50],
                color: colors.primary[700],
                borderColor: colors.primary[200],
              }}
            >
              Filtré: {typeInfo.badgeText}
            </Badge>
          </div>
        )}
      </div>
      <ButtonV2 variant="primary" onClick={onCreateCustomer} icon={Plus}>
        Nouveau Client
      </ButtonV2>
    </div>
  );
}
