// Format helpers for transit times and estimated delivery dates

export function formatTransit(hours: string): string {
  const h = parseInt(hours, 10);
  if (h <= 24) return '24H';
  if (h <= 48) return '48H';
  return `${Math.ceil(h / 24)} JOURS`;
}

export function formatTransitLabel(hours: string): string {
  const h = parseInt(hours, 10);
  if (h <= 24) return '24H PRÉVU';
  if (h <= 48) return '48H PRÉVU';
  return `${Math.ceil(h / 24)} JOURS PRÉVU`;
}

export function formatEstimatedDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}
