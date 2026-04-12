'use client';

import React from 'react';

import { ButtonUnified } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';

interface PdfPreviewDialogProps {
  previewUrl: string | null;
  onClose: () => void;
  title: string;
}

export function PdfPreviewDialog({
  previewUrl,
  onClose,
  title,
}: PdfPreviewDialogProps) {
  return (
    <Dialog open={!!previewUrl} onOpenChange={() => onClose()}>
      <DialogContent
        dialogSize="full"
        hideCloseButton
        className="flex flex-col !p-0 !h-[90vh]"
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            <ButtonUnified variant="outline" size="sm" onClick={onClose}>
              Fermer
            </ButtonUnified>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
