'use client';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { X, FileDown, Loader2 } from 'lucide-react';

interface SelectionProductDetailActionsProps {
  isViewMode: boolean;
  isSaving: boolean;
  isGeneratingPdf: boolean;
  hasChanges: boolean;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  handleDownloadPdf: (showMargin: boolean) => Promise<void>;
}

export function SelectionProductDetailActions({
  isViewMode,
  isSaving,
  isGeneratingPdf,
  hasChanges,
  handleSave,
  handleCancel,
  handleDownloadPdf,
}: SelectionProductDetailActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {isViewMode && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleDownloadPdf(true).catch(error => {
                console.error(
                  '[SelectionProductDetailModal] PDF failed:',
                  error
                );
              });
            }}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            PDF avec marge
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleDownloadPdf(false).catch(error => {
                console.error(
                  '[SelectionProductDetailModal] PDF (no margin) failed:',
                  error
                );
              });
            }}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            PDF sans marge
          </Button>
        </div>
      )}

      {!isViewMode && <div />}

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          {isViewMode ? 'Fermer' : 'Annuler'}
        </Button>
        {!isViewMode && (
          <Button
            onClick={() => {
              void handleSave().catch(error => {
                console.error(
                  '[SelectionProductDetailModal] save failed:',
                  error
                );
              });
            }}
            disabled={!hasChanges || isSaving}
            className={cn(hasChanges && 'bg-primary hover:bg-primary/90')}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer modifications'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
