'use client';

/**
 * Page Bibliothèque Comptable
 *
 * Layout 3 panneaux style Pennylane/Dext :
 * - Gauche: Arborescence Année > Catégorie (Ventes/Achats/Avoirs) > Mois
 * - Centre: Liste des documents avec toolbar + upload + KPIs
 * - Droite: Preview PDF + métadonnées
 *
 * Source de données: table financial_documents (PAS les buckets Storage)
 */

import { useState, useCallback } from 'react';

import { useLibraryDocuments } from '@verone/finance/hooks';
import { FolderArchive } from 'lucide-react';

import { ClassifyDialog } from './_components/classify-dialog';
import { DocumentList } from './_components/document-list';
import type { TreeSelection } from './_components/library-tree';
import { LibraryTree } from './_components/library-tree';
import { LibraryStats } from './_components/library-stats';
import { LibraryToolbar } from './_components/library-toolbar';
import { PdfPreview } from './_components/pdf-preview';
import { UploadZone } from './_components/upload-zone';

import type { LibraryCategory, LibraryDocument } from '@verone/finance/hooks';

// =====================================================================
// PAGE
// =====================================================================

export default function BibliothequeComptablePage() {
  // Tree selection state
  const [treeSelection, setTreeSelection] = useState<TreeSelection>({});

  // Search & category filter from toolbar
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LibraryCategory | 'all'>(
    'all'
  );

  // Document selection
  const [selectedDocument, setSelectedDocument] =
    useState<LibraryDocument | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Upload + classify state
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Compute filters from tree selection + toolbar
  const filters = {
    year: treeSelection.year,
    month: treeSelection.month,
    category:
      treeSelection.category ??
      (categoryFilter !== 'all' ? categoryFilter : undefined),
    search: search || undefined,
  };

  const { documents, tree, stats, loading, error, refresh } =
    useLibraryDocuments(filters);

  // Handlers
  const handleTreeSelect = useCallback((sel: TreeSelection) => {
    setTreeSelection(sel);
    setSelectedDocument(null);
    setSelectedIds([]);
  }, []);

  const handleSelectDocument = useCallback((doc: LibraryDocument) => {
    setSelectedDocument(doc);
  }, []);

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === documents.length ? [] : documents.map(d => d.id)
    );
  }, [documents]);

  const handleCategoryChange = useCallback((value: LibraryCategory | 'all') => {
    setCategoryFilter(value);
    if (value !== 'all') {
      setTreeSelection(prev => ({
        ...prev,
        category: value,
        month: undefined,
      }));
    } else {
      setTreeSelection(prev => ({ ...prev, category: undefined }));
    }
    setSelectedDocument(null);
    setSelectedIds([]);
  }, []);

  const handleExportZip = useCallback(() => {
    if (selectedIds.length === 0) return;

    const year = treeSelection.year ?? new Date().getFullYear();
    const month =
      treeSelection.month !== undefined
        ? String(treeSelection.month + 1).padStart(2, '0')
        : '';
    const ids = selectedIds.join(',');
    const url = `/api/finance/export-justificatifs?year=${year}${month ? `&month=${month}` : ''}&source=bibliotheque&ids=${ids}`;

    window.open(url, '_blank');
  }, [selectedIds, treeSelection.year, treeSelection.month]);

  const handleUploadComplete = useCallback(
    (fileUrl: string, fileName: string) => {
      setUploadedFile({ url: fileUrl, name: fileName });
      setClassifyOpen(true);
    },
    []
  );

  const handleClassified = useCallback(() => {
    setUploadedFile(null);
    void refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header + Stats */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center gap-3 px-6 py-4">
          <FolderArchive className="h-6 w-6" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">Bibliothèque comptable</h1>
            <p className="text-sm text-muted-foreground">
              Documents financiers classés par type et période
            </p>
          </div>
          <div className="w-64">
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
        </div>
        <div className="px-6 pb-4">
          <LibraryStats
            totalDocuments={stats.totalDocuments}
            ventesTotal={stats.ventesTotal}
            achatsTotal={stats.achatsTotal}
            sansPdf={stats.sansPdf}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-6 py-2 bg-red-50 text-red-700 text-sm border-b flex-shrink-0">
          {error}
        </div>
      )}

      {/* 3-panel layout */}
      <div className="grid grid-cols-[280px_1fr_400px] flex-1 min-h-0">
        {/* Left: Tree */}
        <aside className="border-r overflow-hidden">
          <LibraryTree
            tree={tree}
            selection={treeSelection}
            onSelect={handleTreeSelect}
          />
        </aside>

        {/* Center: Toolbar + Document list */}
        <main className="flex flex-col overflow-hidden">
          <LibraryToolbar
            search={search}
            onSearchChange={setSearch}
            category={categoryFilter}
            onCategoryChange={handleCategoryChange}
            selectedCount={selectedIds.length}
            onRefresh={() => {
              void refresh();
            }}
            onExportZip={handleExportZip}
            loading={loading}
          />
          <div className="flex-1 overflow-hidden">
            <DocumentList
              documents={documents}
              selectedDocumentId={selectedDocument?.id ?? null}
              selectedIds={selectedIds}
              onSelectDocument={handleSelectDocument}
              onToggleSelection={handleToggleSelection}
              onToggleAll={handleToggleAll}
              loading={loading}
            />
          </div>
        </main>

        {/* Right: PDF Preview */}
        <aside className="border-l overflow-hidden">
          <PdfPreview document={selectedDocument} />
        </aside>
      </div>

      {/* Classify Dialog */}
      {uploadedFile && (
        <ClassifyDialog
          open={classifyOpen}
          onOpenChange={setClassifyOpen}
          fileUrl={uploadedFile.url}
          fileName={uploadedFile.name}
          onClassified={handleClassified}
        />
      )}
    </div>
  );
}
