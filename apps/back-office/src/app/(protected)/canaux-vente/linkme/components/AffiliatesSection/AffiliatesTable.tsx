'use client';

import { ButtonV2 } from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { Plus, User } from 'lucide-react';

import { AffiliateTableRow } from './AffiliateTableRow';
import type { Affiliate } from './types';

interface AffiliatesTableProps {
  filteredAffiliates: Affiliate[];
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  onEdit: (affiliate: Affiliate) => void;
  onStatusChange: (
    affiliateId: string,
    newStatus: 'active' | 'suspended'
  ) => Promise<void>;
  onDelete: (affiliateId: string) => Promise<void>;
  onCreateClick: () => void;
}

export function AffiliatesTable({
  filteredAffiliates,
  searchTerm,
  typeFilter,
  statusFilter,
  onEdit,
  onStatusChange,
  onDelete,
  onCreateClick,
}: AffiliatesTableProps) {
  if (filteredAffiliates.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun affilié</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
            ? 'Aucun résultat pour ces filtres'
            : 'Commencez par créer votre premier affilié'}
        </p>
        {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
          <ButtonV2 onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un affilié
          </ButtonV2>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Affilié</TableHead>
          <TableHead>Entité liée</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAffiliates.map(affiliate => (
          <AffiliateTableRow
            key={affiliate.id}
            affiliate={affiliate}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
