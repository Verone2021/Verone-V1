/**
 * Helpers locaux pour l'onglet Images.
 * Ne pas exporter vers d'autres modules — scope _images-blocks uniquement.
 */

/**
 * Formate une taille de fichier en octets vers une chaîne lisible.
 * Ex : 2_150_000 → "2,1 MB" · 287_000 → "287 KB" · 512 → "512 o"
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 o';
  if (bytes < 1_024) return `${bytes} o`;
  if (bytes < 1_024 * 1_024) {
    return `${Math.round(bytes / 1_024)} KB`;
  }
  const mb = bytes / (1_024 * 1_024);
  return `${mb.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} MB`;
}

/**
 * Formate une date ISO en "12 avr. 2026".
 */
export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
