'use client';

import Link from 'next/link';

import { IconButton } from '@verone/ui';
import { type Organisation } from '@verone/organisations';
import { Eye, Archive, ArchiveRestore, Trash2 } from 'lucide-react';

import { FavoriteToggleButton } from '@/components/business/favorite-toggle-button';

interface CustomerCardActionsProps {
  customer: Organisation;
  /** true = show archive button, false = show restore+delete buttons */
  isActive: boolean;
  onArchive: (customer: Organisation) => void;
  onDelete: (customer: Organisation) => void;
  onRefetch: () => void;
  onLoadArchived: () => void;
  className?: string;
}

export function CustomerCardActions({
  customer,
  isActive,
  onArchive,
  onDelete,
  onRefetch,
  onLoadArchived,
  className,
}: CustomerCardActionsProps) {
  return (
    <div className={className}>
      {isActive ? (
        <>
          <FavoriteToggleButton
            organisationId={customer.id}
            isFavorite={customer.preferred_supplier === true}
            organisationType="customer"
            disabled={!customer.is_active}
            onToggleComplete={() => {
              onRefetch();
              onLoadArchived();
            }}
            className="h-7 px-2"
          />
          <Link href={`/contacts-organisations/customers/${customer.id}`}>
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
            onClick={() => onArchive(customer)}
            icon={Archive}
            label="Archiver"
          />
        </>
      ) : (
        <>
          <FavoriteToggleButton
            organisationId={customer.id}
            isFavorite={customer.preferred_supplier === true}
            organisationType="customer"
            disabled={!customer.is_active}
            onToggleComplete={() => {
              onRefetch();
              onLoadArchived();
            }}
            className="h-7 px-2"
          />
          <IconButton
            variant="success"
            size="sm"
            onClick={() => onArchive(customer)}
            icon={ArchiveRestore}
            label="Restaurer"
          />
          <IconButton
            variant="danger"
            size="sm"
            onClick={() => onDelete(customer)}
            icon={Trash2}
            label="Supprimer"
          />
          <Link href={`/contacts-organisations/customers/${customer.id}`}>
            <IconButton
              variant="outline"
              size="sm"
              icon={Eye}
              label="Voir détails"
            />
          </Link>
        </>
      )}
    </div>
  );
}
