'use client';

import { useState, useCallback, useMemo } from 'react';

import { ScrollArea } from '@verone/ui';
import { AlertCircle } from 'lucide-react';

import type { LibraryDocument } from '@verone/finance';

import { ClotureCountersBar } from '../_shared-comptable/cloture-counters';
import { ClotureUploadDialog } from '../_shared-comptable/cloture-upload-dialog';
import { ClotureVatPcgDialog } from '../_shared-comptable/cloture-vat-pcg-dialog';
import type { ClotureRow } from '../_shared-comptable/types';
import { useClotureData } from '../_shared-comptable/use-cloture-data';

import { DocumentList } from './_components/document-list';
import { DocumentModal } from './_components/document-modal';
import { LibraryHeader } from './_components/library-header';
import { LibraryToolbar } from './_components/library-toolbar';
import { LibraryTree } from './_components/library-tree';
import { MissingDocumentsSection } from './_components/missing-documents-section';

interface TreeSelection {
  year: number;
  month?: number;
  category?: 'achats' | 'ventes' | 'avoirs';
}

const MONTH_NAMES = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function getSelectionLabel(sel: TreeSelection | null): string {
  if (!sel) return '';
  const parts: string[] = [];
  if (sel.category) {
    parts.push(
      sel.category === 'achats'
        ? 'Achats'
        : sel.category === 'ventes'
          ? 'Ventes'
          : 'Avoirs'
    );
  }
  if (sel.month) parts.push(MONTH_NAMES[sel.month]);
  parts.push(String(sel.year));
  return parts.join(' — ');
}

export default function BibliothequeComptablePage() {
  const [treeSelection, setTreeSelection] = useState<TreeSelection | null>(
    () => ({
      year: new Date().getFullYear(),
    })
  );
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // État partagé des dialogs d'action (galerie + section manquants)
  const [actionRow, setActionRow] = useState<ClotureRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [vatPcgOpen, setVatPcgOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const selectedYear = treeSelection?.year ?? currentYear;

  const { documents, rows, counters, isLoading, error, refetch } =
    useClotureData({
      year: selectedYear,
      month: treeSelection?.month,
      category: treeSelection?.category,
      search: search || undefined,
    });

  // Index des lignes par id pour décorer chaque carte avec son statut
  const rowsById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  const missingRows = useMemo(
    () => rows.filter(r => r.kind === 'missing'),
    [rows]
  );

  const missingCount = missingRows.length;

  const handleSelectDocument = useCallback((doc: LibraryDocument) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  }, []);

  const handleTreeSelect = useCallback((sel: TreeSelection) => {
    setTreeSelection(sel);
  }, []);

  const handleCloseModal = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedDoc(null);
    }
  }, []);

  // Ouvre le dépôt de pièce depuis une carte (LibraryDocument → ClotureRow via index)
  const handleCardUpload = useCallback(
    (doc: LibraryDocument) => {
      const row = rowsById.get(doc.id);
      if (!row) return;
      setActionRow(row);
      setUploadOpen(true);
    },
    [rowsById]
  );

  const handleCardEditVatPcg = useCallback(
    (doc: LibraryDocument) => {
      const row = rowsById.get(doc.id);
      if (!row) return;
      setActionRow(row);
      setVatPcgOpen(true);
    },
    [rowsById]
  );

  // Depuis la section manquants (déjà une ClotureRow)
  const handleRowUpload = useCallback((row: ClotureRow) => {
    setActionRow(row);
    setUploadOpen(true);
  }, []);

  const handleRowEditVatPcg = useCallback((row: ClotureRow) => {
    setActionRow(row);
    setVatPcgOpen(true);
  }, []);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePdfDeleted = useCallback(async () => {
    refetch();
  }, [refetch]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header + actions globales */}
      <LibraryHeader year={selectedYear} onSyncComplete={handleRefetch} />

      {/* Main layout: tree + content */}
      <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
        {/* Left: Tree navigation */}
        <aside className="border-r overflow-hidden">
          <ScrollArea className="h-full p-4">
            <LibraryTree
              onSelect={handleTreeSelect}
              selection={treeSelection}
              missingCount={missingCount}
              documentsCount={documents.length}
            />
          </ScrollArea>
        </aside>

        {/* Right: Documents grid */}
        <main className="overflow-hidden flex flex-col">
          {/* Compteurs de synthèse */}
          <div className="p-4 border-b">
            <ClotureCountersBar counters={counters} isLoading={isLoading} />
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b">
            <LibraryToolbar
              search={search}
              onSearchChange={setSearch}
              onRefresh={handleRefetch}
            />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Document grid */}
          <ScrollArea className="flex-1 p-4">
            <DocumentList
              documents={documents}
              onSelectDocument={handleSelectDocument}
              onPdfDeleted={handlePdfDeleted}
              loading={isLoading}
              label={getSelectionLabel(treeSelection)}
              rowsById={rowsById}
              onUpload={handleCardUpload}
              onEditVatPcg={handleCardEditVatPcg}
            />

            {/* Section manquants actionnable */}
            <MissingDocumentsSection
              rows={missingRows}
              onUpload={handleRowUpload}
              onEditVatPcg={handleRowEditVatPcg}
            />
          </ScrollArea>
        </main>
      </div>

      {/* Document modal (consultation PDF) */}
      <DocumentModal
        document={selectedDoc}
        open={modalOpen}
        onOpenChange={handleCloseModal}
        onPdfDeleted={handlePdfDeleted}
      />

      {/* Dialogs d'action partagés (dépôt pièce + TVA/PCG) */}
      <ClotureUploadDialog
        row={actionRow}
        open={uploadOpen}
        onOpenChange={open => {
          setUploadOpen(open);
          if (!open) setActionRow(null);
        }}
        onUploadComplete={handleRefetch}
      />
      <ClotureVatPcgDialog
        row={actionRow}
        open={vatPcgOpen}
        onOpenChange={open => {
          setVatPcgOpen(open);
          if (!open) setActionRow(null);
        }}
        onSaved={handleRefetch}
      />
    </div>
  );
}
