'use client';

import Image from 'next/image';

import { type Enseigne } from '@verone/organisations';
import { Badge, Card, CardContent, CardHeader } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { spacing } from '@verone/ui/design-system';
import {
  Building,
  Users,
  Pencil,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { getEnseigneLogoUrl } from '../hooks/useEnseignesPage';

interface EnseigneGridViewProps {
  enseignes: Enseigne[];
  isLoading: boolean;
  onEdit: (enseigne: Enseigne) => void;
  onArchive: (enseigne: Enseigne) => void;
  onDelete: (enseigne: Enseigne) => void;
}

export function EnseigneGridView({
  enseignes,
  isLoading,
  onEdit,
  onArchive,
  onDelete,
}: EnseigneGridViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader style={{ padding: spacing[3] }}>
              <div className="h-5 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent style={{ padding: spacing[3] }}>
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {enseignes.map(enseigne => (
        <Card
          key={enseigne.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() =>
            (window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`)
          }
        >
          <CardContent className="p-6">
            {/* Header: Logo à gauche, Badge à droite */}
            <div className="flex items-start justify-between mb-4">
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                {enseigne.logo_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={getEnseigneLogoUrl(enseigne.logo_url) ?? ''}
                      alt={enseigne.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Building className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <Badge variant={enseigne.is_active ? 'default' : 'secondary'}>
                {enseigne.is_active ? 'Active' : 'Archivée'}
              </Badge>
            </div>

            {/* Nom */}
            <h3 className="font-semibold text-lg mb-4">{enseigne.name}</h3>

            {/* Stats sur une ligne */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{enseigne.member_count} organisation(s)</span>
              </div>
            </div>

            {/* Actions - IconButton 32x32px UNIQUEMENT */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              {enseigne.is_active ? (
                <>
                  <IconButton
                    icon={Eye}
                    label="Voir"
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`;
                    }}
                  />
                  <IconButton
                    icon={Pencil}
                    label="Modifier"
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onEdit(enseigne);
                    }}
                  />
                  <IconButton
                    icon={Archive}
                    label="Archiver"
                    variant="danger"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      void onArchive(enseigne);
                    }}
                  />
                </>
              ) : (
                <>
                  <IconButton
                    icon={Eye}
                    label="Voir"
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`;
                    }}
                  />
                  <IconButton
                    icon={ArchiveRestore}
                    label="Restaurer"
                    variant="success"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      void onArchive(enseigne);
                    }}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Supprimer"
                    variant="danger"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(enseigne);
                    }}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
