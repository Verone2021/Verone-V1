'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Mail } from 'lucide-react';

interface ShippingEmailPreviewDialogProps {
  html: string | null;
  onClose: () => void;
}

export function ShippingEmailPreviewDialog({
  html,
  onClose,
}: ShippingEmailPreviewDialogProps) {
  if (!html) return null;

  return (
    <Dialog open={!!html} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto md:max-w-2xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Aperçu de l'email
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded border border-gray-200 bg-white">
          <iframe
            srcDoc={html}
            title="Aperçu email"
            className="h-[60vh] w-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
