'use client';

import { useState, useCallback } from 'react';

import { ScrollArea } from '@verone/ui';
import { FolderArchive } from 'lucide-react';

import { useLibraryDocuments } from '@verone/finance';
import type { LibraryDocument } from '@verone/finance';

import { LibraryTree } from './_components/library-tree';
import { LibraryToolbar } from './_components/library-toolbar';
import { DocumentList } from './_components/document-list';
import { DocumentModal } from './_components/document-modal';

interface TreeSelection {
  year: number;
  month?: number;
  category?: 'achats' | 'ventes' | 'avoirs';
}

function getSelectionLabel(sel: TreeSelection | null): string {
  if (!sel) return '';
  const months = [
    '',
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre',
  ];
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
  if (sel.month) parts.push(months[sel.month]);
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

  const { documents, isLoading, refetch } = useLibraryDocuments({
    year: treeSelection?.year,
    month: treeSelection?.month,
    category: treeSelection?.category,
    search: search || undefined,
  });

  const handleSelectDocument = useCallback((doc: LibraryDocument) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  }, []);

  const handleTreeSelect = useCallback((sel: TreeSelection) => {
    setTreeSelection(sel);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FolderArchive className="h-5 w-5" />
            Bibliotheque comptable
          </h1>
          <p className="text-sm text-muted-foreground">
            Documents comptables classes par type et periode
          </p>
        </div>
      </div>

      {/* Main layout: tree + content */}
      <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
        {/* Left: Tree navigation */}
        <aside className="border-r overflow-hidden">
          <ScrollArea className="h-full p-4">
            <LibraryTree
              onSelect={handleTreeSelect}
              selection={treeSelection}
            />
          </ScrollArea>
        </aside>

        {/* Right: Documents grid */}
        <main className="overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b">
            <LibraryToolbar
              search={search}
              onSearchChange={setSearch}
              onRefresh={() => {
                void refetch();
              }}
            />
          </div>

          {/* Document grid */}
          <ScrollArea className="flex-1 p-4">
            <DocumentList
              documents={documents}
              onSelectDocument={handleSelectDocument}
              loading={isLoading}
              label={getSelectionLabel(treeSelection)}
            />
          </ScrollArea>
        </main>
      </div>

      {/* Document modal */}
      <DocumentModal
        document={selectedDoc}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
