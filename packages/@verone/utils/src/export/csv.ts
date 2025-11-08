// =====================================================================
// Export CSV Utility
// Date: 2025-10-11
// Description: Utilitaires pour export CSV des données bancaires
// =====================================================================

/**
 * Convertit un tableau d'objets en CSV
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // En-têtes
  const headerRow = headers.map(h => h.label).join(';');

  // Lignes de données
  const dataRows = data.map(row => {
    return headers
      .map(h => {
        const value = row[h.key];

        // Échapper les guillemets et virgules
        if (value === null || value === undefined) return '';

        const stringValue = String(value);
        if (
          stringValue.includes(';') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(';');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Télécharge un fichier CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Ajouter BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Formate une date pour export CSV
 */
export function formatDateForCSV(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

/**
 * Formate un montant pour export CSV
 */
export function formatAmountForCSV(amount: number, currency = 'EUR'): string {
  return amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency,
  });
}
