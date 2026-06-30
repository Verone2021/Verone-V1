'use client';

import { FolderArchive } from 'lucide-react';

import type { LibraryDocument } from '@verone/finance';

import type { ClotureRow } from '../../_shared-comptable/types';
import { DocumentCard } from './document-card';

interface DocumentListProps {
  documents: LibraryDocument[];
  onSelectDocument: (doc: LibraryDocument) => void;
  onPdfDeleted?: () => Promise<void>;
  loading?: boolean;
  label?: string;
  /** Index des lignes de clôture par id, pour le statut de chaque carte (BO-COMPTA-001) */
  rowsById?: Map<string, ClotureRow>;
  onUpload?: (doc: LibraryDocument) => void;
  onEditVatPcg?: (doc: LibraryDocument) => void;
}

export function DocumentList({
  documents,
  onSelectDocument,
  onPdfDeleted,
  loading,
  label,
  rowsById,
  onUpload,
  onEditVatPcg,
}: DocumentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-muted-foreground">
          Chargement des documents...
        </span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FolderArchive className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Aucun document trouve</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm text-muted-foreground px-1">
          {documents.length} document{documents.length > 1 ? 's' : ''} — {label}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
        {documents.map(doc => (
          <DocumentCard
            key={`${doc.source_table}-${doc.id}`}
            document={doc}
            onSelect={onSelectDocument}
            onPdfDeleted={onPdfDeleted}
            signals={rowsById?.get(doc.id)?.signals}
            onUpload={onUpload}
            onEditVatPcg={onEditVatPcg}
          />
        ))}
      </div>
    </div>
  );
}
