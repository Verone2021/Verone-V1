'use client';

import Link from 'next/link';

import { IconButton } from '@verone/ui';
import { type Organisation } from '@verone/organisations';
import { Archive, ArchiveRestore, Eye, Trash2 } from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

interface PartnerActionsProps {
  partner: Organisation;
  activeTab: 'active' | 'archived' | 'preferred';
  onArchive: (partner: Organisation) => Promise<void>;
  onDelete: (partner: Organisation) => void;
  onFavoriteToggle: () => void;
  className?: string;
}

export function PartnerActions({
  partner,
  activeTab,
  onArchive,
  onDelete,
  onFavoriteToggle,
  className,
}: PartnerActionsProps) {
  const isActive = activeTab === 'active' || activeTab === 'preferred';

  return (
    <div className={className ?? 'flex items-center gap-1'}>
      <FavoriteToggleButton
        organisationId={partner.id}
        isFavorite={partner.preferred_supplier === true}
        organisationType="partner"
        disabled={!partner.is_active}
        onToggleComplete={onFavoriteToggle}
        className="h-7 px-2"
      />

      <Link href={`/contacts-organisations/partners/${partner.id}`}>
        <IconButton
          variant="outline"
          size="sm"
          icon={Eye}
          label="Voir détails"
        />
      </Link>

      {isActive ? (
        <IconButton
          variant="danger"
          size="sm"
          onClick={() => {
            void onArchive(partner).catch(err => {
              console.error('[Partners] Archive action failed:', err);
            });
          }}
          icon={Archive}
          label="Archiver"
        />
      ) : (
        <>
          <IconButton
            variant="success"
            size="sm"
            onClick={() => {
              void onArchive(partner).catch(err => {
                console.error('[Partners] Archive action failed:', err);
              });
            }}
            icon={ArchiveRestore}
            label="Restaurer"
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(partner)}
            icon={Trash2}
            label="Supprimer"
          />
        </>
      )}
    </div>
  );
}
