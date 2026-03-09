'use client';

import React from 'react';

import { BlobProvider, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

import { Button } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: React.ReactElement;
  title: string;
  filename?: string;
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  document: pdfDocument,
  title,
  filename,
}: PdfPreviewModalProps) {
  const handleDownload = () => {
    void pdf(pdfDocument)
      .toBlob()
      .then(blob => {
        saveAs(blob, filename || 'rapport.pdf');
      })
      .catch((err: unknown) => {
        console.error('[PdfPreviewModal] Download failed:', err);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        dialogSize="full"
        hideCloseButton
        className="flex flex-col !p-0 !h-[90vh]"
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
              <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Telecharger
              </Button>
              <Button onClick={onClose} variant="secondary" size="sm">
                Fermer
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview iframe via BlobProvider */}
        <BlobProvider document={pdfDocument}>
          {({ url, loading, error }) => (
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500 ml-3">
                    Generation du PDF...
                  </p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-red-600">
                    Erreur: {String(error)}
                  </p>
                </div>
              ) : url ? (
                <iframe
                  src={url}
                  className="w-full h-full border-0"
                  title={title}
                />
              ) : null}
            </div>
          )}
        </BlobProvider>
      </DialogContent>
    </Dialog>
  );
}
