import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { AgingReportData } from '@verone/finance';

// =============================================
// EXPORT PDF - Template Professionnel Vérone
// =============================================

export function exportAgingReportToPDF(report: AgingReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête Vérone
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('VÉRONE', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Back Office - CRM/ERP', 14, 26);

  // Titre du rapport
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport Aging Inventaire', 14, 40);

  // Date de génération
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const generatedDate = new Date(report.generated_at).toLocaleString('fr-FR');
  doc.text(`Généré le ${generatedDate}`, 14, 46);

  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(14, 50, pageWidth - 14, 50);

  // ============================================
  // SECTION 1: Métriques Globales
  // ============================================
  let yPos = 58;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Métriques Globales', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const metrics = [
    `Produits analysés: ${report.summary.total_products} (${report.summary.total_quantity} unités)`,
    `Valeur totale stock: ${report.summary.total_value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
    `Âge moyen inventaire: ${report.summary.average_age_days} jours`,
    `Stock vieilli (>90j): ${report.summary.percent_over_90_days}% (${report.summary.immobilized_value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € immobilisés)`,
  ];

  metrics.forEach(metric => {
    doc.text(metric, 14, yPos);
    yPos += 6;
  });

  yPos += 4;

  // ============================================
  // SECTION 2: Distribution par Tranches
  // ============================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Distribution par Tranches d'Âge", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Tranche', 'Produits', 'Quantité', 'Valeur', 'Part']],
    body: report.buckets.map((bucket: AgingReportData['buckets'][number]) => [
      bucket.label,
      bucket.count.toString(),
      bucket.quantity.toString(),
      `${bucket.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
      `${bucket.percentage.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 45 },
      4: { halign: 'center', cellWidth: 25 },
    },
  });

  // ============================================
  // SECTION 3: Top 20 Produits Anciens
  // ============================================
  doc.addPage();
  yPos = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 20 - Produits les Plus Anciens', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Produit', 'SKU', 'Âge (j)', 'Stock', 'Valeur', 'Tranche']],
    body: report.top_oldest.map((product: AgingReportData['top_oldest'][number]) => [
      product.name.length > 30
        ? product.name.substring(0, 27) + '...'
        : product.name,
      product.sku,
      product.age_days.toString(),
      product.stock_quantity.toString(),
      `${product.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`,
      product.bucket,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 30 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'center', cellWidth: 20 },
    },
  });

  // Footer sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Vérone Back Office - Rapport Aging Inventaire - Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Téléchargement
  const filename = `verone-aging-inventaire-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// =============================================
// EXPORT EXCEL - Formatage Professionnel
// =============================================

export async function exportAgingReportToExcel(report: AgingReportData) {
  // Dynamic import pour optimiser bundle (xlsx = ~200kB)
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ============================================
  // Feuille 1: Vue d'Ensemble
  // ============================================
  const overviewData = [
    ['VÉRONE - Rapport Aging Inventaire'],
    [`Généré le ${new Date(report.generated_at).toLocaleString('fr-FR')}`],
    [],
    ['MÉTRIQUES GLOBALES'],
    ['Produits analysés', report.summary.total_products],
    ['Quantité totale', report.summary.total_quantity],
    [
      'Valeur totale stock',
      `${report.summary.total_value.toLocaleString('fr-FR')} €`,
    ],
    ['Âge moyen inventaire', `${report.summary.average_age_days} jours`],
    ['Stock vieilli (>90j)', `${report.summary.percent_over_90_days}%`],
    [
      'Valeur immobilisée',
      `${report.summary.immobilized_value.toLocaleString('fr-FR')} €`,
    ],
    [],
    ['DISTRIBUTION PAR TRANCHES'],
    ['Tranche', 'Produits', 'Quantité', 'Valeur', 'Pourcentage'],
    ...report.buckets.map((bucket: AgingReportData['buckets'][number]) => [
      bucket.label,
      bucket.count,
      bucket.quantity,
      `${bucket.value.toLocaleString('fr-FR')} €`,
      `${bucket.percentage.toFixed(1)}%`,
    ]),
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);

  // Largeurs de colonnes
  wsOverview['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, wsOverview, "Vue d'Ensemble");

  // ============================================
  // Feuille 2: Top 20 Produits
  // ============================================
  const productsData = [
    ['Top 20 - Produits les Plus Anciens'],
    [],
    [
      'Produit',
      'SKU',
      'Âge (jours)',
      'Stock',
      'Prix Unitaire',
      'Valeur',
      'Tranche',
      'Dernier Mouvement',
    ],
    ...report.top_oldest.map((product: AgingReportData['top_oldest'][number]) => [
      product.name,
      product.sku,
      product.age_days,
      product.stock_quantity,
      `${product.cost_price.toLocaleString('fr-FR')} €`,
      `${product.value.toLocaleString('fr-FR')} €`,
      product.bucket,
      product.last_movement_date
        ? new Date(product.last_movement_date).toLocaleDateString('fr-FR')
        : 'Jamais',
    ]),
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);

  // Largeurs de colonnes
  wsProducts['!cols'] = [
    { wch: 35 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Top 20 Produits');

  // Téléchargement
  const filename = `verone-aging-inventaire-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// =============================================
// EXPORT CSV - Format Simple
// =============================================

export function exportAgingReportToCSV(report: AgingReportData) {
  const headers = [
    'Produit',
    'SKU',
    'Âge (jours)',
    'Stock',
    'Prix Unitaire (€)',
    'Valeur (€)',
    'Tranche',
    'Dernier Mouvement',
  ].join(',');

  const rows = report.top_oldest.map((product: AgingReportData['top_oldest'][number]) =>
    [
      `"${product.name.replace(/"/g, '""')}"`,
      product.sku,
      product.age_days,
      product.stock_quantity,
      product.cost_price.toFixed(2),
      product.value.toFixed(2),
      product.bucket,
      product.last_movement_date
        ? new Date(product.last_movement_date).toLocaleDateString('fr-FR')
        : 'Jamais',
    ].join(',')
  );

  const csv = [headers, ...rows].join('\n');

  // Téléchargement
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `verone-aging-inventaire-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
