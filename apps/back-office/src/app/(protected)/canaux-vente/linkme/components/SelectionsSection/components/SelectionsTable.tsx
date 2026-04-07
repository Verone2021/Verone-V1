'use client';

import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Layers,
  Eye,
  Package,
  ShoppingBag,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';

import type { Selection } from '../types';

interface SelectionsTableProps {
  selections: Selection[];
  searchTerm: string;
  affiliateFilter: string;
  activeTab: 'active' | 'archived';
  onArchive: (selection: Selection) => Promise<void>;
  onDelete: (selectionId: string, selectionName: string) => Promise<void>;
}

export function SelectionsTable({
  selections,
  searchTerm,
  affiliateFilter,
  activeTab,
  onArchive,
  onDelete,
}: SelectionsTableProps) {
  if (selections.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune sélection</h3>
        <p className="text-muted-foreground">
          {searchTerm || affiliateFilter !== 'all'
            ? 'Aucun résultat pour ces filtres'
            : activeTab === 'archived'
              ? 'Aucune sélection archivée'
              : "Les affiliés n'ont pas encore créé de sélections"}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sélection</TableHead>
          <TableHead>Affilié</TableHead>
          <TableHead>Produits</TableHead>
          <TableHead>Vues</TableHead>
          <TableHead>Commandes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {selections.map(selection => (
          <TableRow key={selection.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{selection.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    /{selection.affiliate?.slug}/{selection.slug}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>{selection.affiliate?.display_name ?? 'N/A'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                {selection.products_count}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {selection.views_count}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                {selection.orders_count}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/canaux-vente/linkme/selections/${selection.id}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 transition-all"
                  title="Voir la sélection"
                >
                  <Eye className="h-4 w-4" />
                </Link>

                {selection.archived_at !== null ? (
                  <ButtonV2
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      void onArchive(selection).catch(error => {
                        console.error(
                          '[SelectionsSection] Archive failed:',
                          error
                        );
                      });
                    }}
                    title="Désarchiver la sélection"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </ButtonV2>
                ) : (
                  <ButtonV2
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      void onArchive(selection).catch(error => {
                        console.error(
                          '[SelectionsSection] Archive failed:',
                          error
                        );
                      });
                    }}
                    title="Archiver la sélection"
                  >
                    <Archive className="h-4 w-4" />
                  </ButtonV2>
                )}

                {selection.archived_at !== null && (
                  <ButtonV2
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void onDelete(selection.id, selection.name).catch(
                        error => {
                          console.error(
                            '[SelectionsSection] Delete failed:',
                            error
                          );
                        }
                      );
                    }}
                    title="Supprimer la sélection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ButtonV2>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
