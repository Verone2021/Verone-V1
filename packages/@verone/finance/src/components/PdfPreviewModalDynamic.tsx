'use client';

import dynamic from 'next/dynamic';

export const PdfPreviewModalDynamic = dynamic(
  () =>
    import('./PdfPreviewModal').then(mod => ({ default: mod.PdfPreviewModal })),
  { ssr: false }
);
