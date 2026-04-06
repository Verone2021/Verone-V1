'use client';

import Link from 'next/link';

import { type Organisation } from '@verone/organisations';
import { IconButton } from '@verone/ui';
import { Archive, ArchiveRestore, Trash2, Eye } from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

interface SupplierCardActionsProps {
  supplier: Organisation;
  isActive: boolean;
  onArchive: (supplier: Organisation) => Promise<void>;
  onDelete: (supplier: Organisation) => void;
  onFavoriteRefresh: () => void;
}

export function SupplierCardActions({
  supplier,
  isActive,
  onArchive,
  onDelete,
  onFavoriteRefresh,
}: SupplierCardActionsProps) {
  const handleArchiveClick = () => {
    void onArchive(supplier).catch(error => {
      console.error('[Suppliers] Archive action failed:', error);
    });
  };

  return (
    <>
      <FavoriteToggleButton
        organisationId={supplier.id}
        isFavorite={supplier.preferred_supplier === true}
        organisationType="supplier"
        disabled={!supplier.is_active}
        onToggleComplete={onFavoriteRefresh}
        className="h-7 px-2"
      />

      {isActive ? (
        <>
          <Link href={`/contacts-organisations/suppliers/${supplier.id}`}>
            <IconButton
              variant="outline"
              size="sm"
              icon={Eye}
              label="Voir détails"
            />
          </Link>
          <IconButton
            variant="danger"
            size="sm"
            onClick={handleArchiveClick}
            icon={Archive}
            label="Archiver"
          />
        </>
      ) : (
        <>
          <IconButton
            variant="success"
            size="sm"
            onClick={handleArchiveClick}
            icon={ArchiveRestore}
            label="Restaurer"
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(supplier)}
            icon={Trash2}
            label="Supprimer"
          />
          <Link href={`/contacts-organisations/suppliers/${supplier.id}`}>
            <IconButton
              variant="outline"
              size="sm"
              icon={Eye}
              label="Voir détails"
            />
          </Link>
        </>
      )}
    </>
  );
}
