import type { ClientConsultation } from '@verone/consultations';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { ReactElement } from 'react';
import { createElement } from 'react';

// Pre-load images as compressed base64 for @react-pdf (remote URLs block the renderer)
// Uses canvas to resize + JPEG compress → keeps PDF under 500 KB
export async function imageUrlToBase64(
  url: string,
  maxSize = 300,
  quality = 0.6
): Promise<string | null> {
  try {
    // Load image via HTMLImageElement (handles CORS naturally for public URLs)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = url;
    });

    // Calculate scaled dimensions (never upscale)
    const ratio = Math.min(
      maxSize / img.naturalWidth,
      maxSize / img.naturalHeight,
      1
    );
    const width = Math.round(img.naturalWidth * ratio);
    const height = Math.round(img.naturalHeight * ratio);

    // Draw on canvas and export as compressed JPEG data URI
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('[imageUrlToBase64] Failed for:', url, err);
    return null;
  }
}

// Helper pour récupérer le nom du client (enseigne ou organisation)
export function getClientName(consultation: ClientConsultation | null): string {
  if (!consultation) return 'Client inconnu';
  if (consultation.enseigne?.name) {
    return consultation.enseigne.name;
  }
  if (consultation.organisation?.trade_name) {
    return consultation.organisation.trade_name;
  }
  if (consultation.organisation?.legal_name) {
    return consultation.organisation.legal_name;
  }
  return 'Client inconnu';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'en_attente':
      return 'bg-gray-100 text-gray-900 border-gray-200';
    case 'en_cours':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'terminee':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'annulee':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusIcon(status: string): ReactElement {
  switch (status) {
    case 'en_attente':
      return createElement(Clock, { className: 'h-3 w-3' });
    case 'en_cours':
      return createElement(AlertCircle, { className: 'h-3 w-3' });
    case 'terminee':
      return createElement(CheckCircle, { className: 'h-3 w-3' });
    case 'annulee':
      return createElement(XCircle, { className: 'h-3 w-3' });
    default:
      return createElement(Clock, { className: 'h-3 w-3' });
  }
}

export function getPriorityColor(level: number): string {
  switch (level) {
    case 5:
      return 'bg-red-100 text-red-800 border-red-200';
    case 4:
      return 'bg-gray-100 text-gray-900 border-gray-200';
    case 3:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 2:
      return 'bg-green-100 text-green-800 border-green-200';
    case 1:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPriorityLabel(level: number): string {
  switch (level) {
    case 5:
      return 'Très urgent';
    case 4:
      return 'Urgent';
    case 3:
      return 'Normal+';
    case 2:
      return 'Normal';
    case 1:
      return 'Faible';
    default:
      return 'Normal';
  }
}

// ── Image preloading ─────────────────────────────────────────────────

export async function preloadProductImages(
  items: Array<{
    product_id: string;
    product?: { image_url?: string | null } | null;
  }>
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    items
      .filter(item => item.product?.image_url)
      .map(async item => {
        const base64 = await imageUrlToBase64(
          item.product!.image_url!,
          300,
          0.6
        );
        return [item.product_id, base64 ?? ''] as const;
      })
  );
  return Object.fromEntries(entries.filter(([, b]) => b));
}

export const statusOptions: {
  value: ClientConsultation['status'];
  label: string;
}[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'annulee', label: 'Annulée' },
];
