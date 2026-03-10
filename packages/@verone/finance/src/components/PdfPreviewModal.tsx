'use client';

import React, { useEffect, useRef, useState } from 'react';

import { pdf } from '@react-pdf/renderer';
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);

  // One-shot PDF generation — runs once when modal opens, no re-render loop
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setGenerating(true);
    setError(null);

    void pdf(pdfDocument)
      .toBlob()
      .then(blob => {
        if (cancelled) return;
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setBlobUrl(url);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[PdfPreviewModal] Generation failed:', err);
        setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on open
  }, [isOpen]);

  const handleDownload = () => {
    if (blobRef.current) {
      saveAs(blobRef.current, filename || 'rapport.pdf');
    } else {
      // Fallback: regenerate
      void pdf(pdfDocument)
        .toBlob()
        .then(blob => {
          saveAs(blob, filename || 'rapport.pdf');
        })
        .catch((err: unknown) => {
          console.error('[PdfPreviewModal] Download failed:', err);
        });
    }
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

        {/* Preview iframe — one-shot blob, no BlobProvider re-render loop */}
        <div className="flex-1 overflow-hidden">
          {generating ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 ml-3">Generation du PDF...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-600">Erreur: {error}</p>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={title}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
