/**
 * 📄 Utilitaires PDF - Génération avec jsPDF
 *
 * Génération de PDFs pour les commandes clients avec styling Vérone
 * Utilise jsPDF + jspdf-autotable pour un rendu professionnel
 *
 * Date: 2025-10-14
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { SalesOrder, SalesOrderItem } from '../hooks/use-sales-orders';

// Formattage montants
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Formattage date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Labels statuts
const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Validée',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

/**
 * Génère un PDF pour une commande client
 */
export function generateSalesOrderPDF(
  order: SalesOrder,
  items: SalesOrderItem[]
): Uint8Array {
  const doc = new jsPDF();

  // Calcul nom client
  const clientName =
    order.customer_type === 'organization'
      ? order.organisations?.name || 'Client professionnel'
      : `${order.individual_customers?.first_name || ''} ${order.individual_customers?.last_name || ''}`.trim() ||
        'Client particulier';

  // Calcul totaux
  const totalTVA = order.total_ttc - order.total_ht;

  let yPosition = 20;

  // ============ HEADER ============
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('VÉRONE', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Décoration & Mobilier d'Intérieur Haut de Gamme", 20, yPosition);
  yPosition += 5;
  doc.text("123 Rue de l'Élégance, 75001 Paris, France", 20, yPosition);
  yPosition += 5;
  doc.text('Tél: +33 1 23 45 67 89 | contact@verone.fr', 20, yPosition);

  // Ligne de séparation
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  // ============ TITLE ============
  yPosition += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Commande Client', 20, yPosition);

  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(order.order_number, 20, yPosition);

  // ============ INFO BOXES ============
  yPosition += 10;

  // Order Info Box
  doc.setFillColor(249, 249, 249);
  doc.rect(20, yPosition, 80, 35, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS COMMANDE', 25, yPosition + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(order.created_at)}`, 25, yPosition + 14);
  doc.text(
    `Statut: ${statusLabels[order.status] || order.status}`,
    25,
    yPosition + 20
  );

  if (order.expected_delivery_date) {
    doc.text(
      `Livraison prévue: ${formatDate(order.expected_delivery_date)}`,
      25,
      yPosition + 26
    );
  }

  if (order.payment_terms) {
    doc.text(`Conditions: ${order.payment_terms}`, 25, yPosition + 32);
  }

  // Client Info Box
  doc.setFillColor(249, 249, 249);
  doc.rect(110, yPosition, 80, 35, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS CLIENT', 115, yPosition + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${clientName}`, 115, yPosition + 14);
  doc.text(
    `Type: ${order.customer_type === 'organization' ? 'Professionnel' : 'Particulier'}`,
    115,
    yPosition + 20
  );

  if (order.organisations?.email) {
    doc.text(`Email: ${order.organisations.email}`, 115, yPosition + 26);
  }

  yPosition += 40;

  // ============ ITEMS TABLE ============
  const tableData = items.map(item => [
    item.products?.name || 'Produit',
    item.products?.sku || 'N/A',
    item.quantity.toString(),
    formatCurrency(item.unit_price_ht),
    item.discount_percentage > 0 ? `${item.discount_percentage}%` : '-',
    formatCurrency(item.total_ht),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [
      ['Produit', 'Référence', 'Qté', 'Prix Unit. HT', 'Remise', 'Total HT'],
    ],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  // Get position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;

  // ============ TOTALS ============
  yPosition = finalY + 10;

  const totalsX = 130;
  doc.setFontSize(9);

  // Sous-total HT
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total HT', totalsX, yPosition);
  doc.text(formatCurrency(order.total_ht), 180, yPosition, { align: 'right' });

  yPosition += 6;
  doc.text(`TVA (${order.tax_rate * 100}%)`, totalsX, yPosition);
  doc.text(formatCurrency(totalTVA), 180, yPosition, { align: 'right' });

  // Total TTC
  yPosition += 8;
  doc.setFillColor(0, 0, 0);
  doc.rect(totalsX - 5, yPosition - 5, 60, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL TTC', totalsX, yPosition);
  doc.text(formatCurrency(order.total_ttc), 180, yPosition, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // ============ NOTES ============
  if (order.notes) {
    yPosition += 15;
    doc.setFillColor(249, 249, 249);
    doc.rect(20, yPosition, 170, 20, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 25, yPosition + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(order.notes, 160);
    doc.text(splitNotes, 25, yPosition + 13);
  }

  // ============ FOOTER ============
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);

  const footerText = [
    'VÉRONE - SARL au capital de 50 000 € - SIRET: 123 456 789 00012',
    'TVA Intracommunautaire: FR12 345 678 901 - RCS Paris B 123 456 789',
    `Document généré le ${formatDate(new Date().toISOString())}`,
  ];

  doc.text(footerText, 105, pageHeight - 15, { align: 'center' });

  // Retourner le PDF en Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
