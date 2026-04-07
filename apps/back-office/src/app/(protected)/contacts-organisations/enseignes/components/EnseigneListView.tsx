'use client';

import Image from 'next/image';
import Link from 'next/link';

import { type Enseigne } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { IconButton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { colors } from '@verone/ui/design-system';
import {
  Building,
  Pencil,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import { getEnseigneLogoUrl } from '../hooks/useEnseignesPage';

interface EnseigneListViewProps {
  enseignes: Enseigne[];
  isLoading: boolean;
  onEdit: (enseigne: Enseigne) => void;
  onArchive: (enseigne: Enseigne) => void;
  onDelete: (enseigne: Enseigne) => void;
}

export function EnseigneListView({
  enseignes,
  isLoading,
  onEdit,
  onArchive,
  onDelete,
}: EnseigneListViewProps) {
  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: colors.border.DEFAULT }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ color: colors.text.DEFAULT }}>
              Enseigne
            </TableHead>
            <TableHead
              className="text-center"
              style={{ color: colors.text.DEFAULT }}
            >
              Organisations
            </TableHead>
            <TableHead
              className="text-center"
              style={{ color: colors.text.DEFAULT }}
            >
              Statut
            </TableHead>
            <TableHead
              className="text-right"
              style={{ color: colors.text.DEFAULT }}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : enseignes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="p-8 text-center">
                <p style={{ color: colors.text.subtle }}>
                  Aucune enseigne trouvée
                </p>
              </TableCell>
            </TableRow>
          ) : (
            enseignes.map(enseigne => (
              <TableRow key={enseigne.id} className="hover:bg-neutral-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                      style={{
                        backgroundColor: colors.primary[100],
                        color: colors.primary[600],
                      }}
                    >
                      {enseigne.logo_url ? (
                        <Image
                          src={getEnseigneLogoUrl(enseigne.logo_url) ?? ''}
                          alt={enseigne.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-medium">{enseigne.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{enseigne.member_count}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={enseigne.is_active ? 'default' : 'secondary'}>
                    {enseigne.is_active ? 'Active' : 'Archivée'}
                  </Badge>
                </TableCell>
                {/* Actions - Pattern Catalogue IconButton */}
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {enseigne.is_active ? (
                      <>
                        <Link
                          href={`/contacts-organisations/enseignes/${enseigne.id}`}
                        >
                          <IconButton
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            label="Voir détails"
                          />
                        </Link>
                        <IconButton
                          variant="outline"
                          size="sm"
                          icon={Pencil}
                          label="Modifier"
                          onClick={() => onEdit(enseigne)}
                        />
                        <IconButton
                          variant="danger"
                          size="sm"
                          icon={Archive}
                          label="Archiver"
                          onClick={() => {
                            void onArchive(enseigne);
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          variant="success"
                          size="sm"
                          icon={ArchiveRestore}
                          label="Restaurer"
                          onClick={() => {
                            void onArchive(enseigne);
                          }}
                        />
                        <IconButton
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          label="Supprimer"
                          onClick={() => onDelete(enseigne)}
                        />
                        <Link
                          href={`/contacts-organisations/enseignes/${enseigne.id}`}
                        >
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
