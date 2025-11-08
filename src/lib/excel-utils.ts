import ExcelJS from 'exceljs';
// FIXME: Module '@/types/sales-order' does not exist - TS2307
// import type { SalesOrder } from '@verone/types'

// Temporary type until sales-order type is available
interface SalesOrder {
  order_number: string;
  customer_type: 'organization' | 'individual';
  organisations?: { name: string };
  individual_customers?: { first_name: string; last_name: string };
  created_at: string;
  total_ht: number | null;
  total_ttc: number | null;
  status: string;
}

interface SalesOrderStats {
  total_orders: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  average_basket: number;
  pending_orders: number;
  shipped_orders: number;
}

/**
 * Génère un fichier Excel (.xlsx) des commandes avec 2 sheets:
 * - Sheet 1 "Commandes": Liste des commandes filtrées
 * - Sheet 2 "Statistiques": Stats agrégées
 *
 * @param orders - Commandes filtrées à exporter
 * @param stats - Statistiques calculées sur les commandes
 * @returns Buffer du fichier Excel
 */
export async function generateSalesOrdersExcel(
  orders: SalesOrder[],
  stats: SalesOrderStats
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Métadonnées workbook
  workbook.creator = 'Vérone Back Office';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==================== SHEET 1: COMMANDES ====================
  const sheet1 = workbook.addWorksheet('Commandes', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }], // Freeze première ligne
  });

  // Colonnes
  sheet1.columns = [
    { header: 'N° Commande', key: 'order_number', width: 18 },
    { header: 'Client', key: 'client_name', width: 35 },
    { header: 'Type', key: 'customer_type', width: 15 },
    { header: 'Date', key: 'created_at', width: 15 },
    { header: 'Montant HT (€)', key: 'total_ht', width: 16 },
    { header: 'TVA (€)', key: 'total_tva', width: 12 },
    { header: 'Montant TTC (€)', key: 'total_ttc', width: 17 },
    { header: 'Statut', key: 'status', width: 15 },
  ];

  // Styling header (noir Vérone #000000)
  const headerRow = sheet1.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Remplir données
  orders.forEach(order => {
    const clientName =
      order.customer_type === 'organization'
        ? order.organisations?.name || 'N/A'
        : `${order.individual_customers?.first_name || ''} ${order.individual_customers?.last_name || ''}`.trim() ||
          'N/A';

    const customerTypeLabel =
      order.customer_type === 'organization' ? 'Professionnel' : 'Particulier';

    const statusLabels: Record<string, string> = {
      draft: 'Brouillon',
      confirmed: 'Validée',
      partially_shipped: 'Partiellement expédiée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };

    const row = sheet1.addRow({
      order_number: order.order_number,
      client_name: clientName,
      customer_type: customerTypeLabel,
      created_at: new Date(order.created_at),
      total_ht: order.total_ht || 0,
      total_tva: (order.total_ttc || 0) - (order.total_ht || 0),
      total_ttc: order.total_ttc || 0,
      status: statusLabels[order.status] || order.status,
    });

    // Formatage montants avec 2 décimales
    row.getCell('total_ht').numFmt = '#,##0.00 €';
    row.getCell('total_tva').numFmt = '#,##0.00 €';
    row.getCell('total_ttc').numFmt = '#,##0.00 €';

    // Formatage date
    row.getCell('created_at').numFmt = 'dd/mm/yyyy';

    // Bordures
    row.eachCell({ includeEmpty: false }, cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      };
    });

    // Couleur alternée (zebra striping)
    if (row.number % 2 === 0) {
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' },
        };
      });
    }
  });

  // Activer filtres colonnes
  sheet1.autoFilter = {
    from: 'A1',
    to: `H${orders.length + 1}`,
  };

  // ==================== SHEET 2: STATISTIQUES ====================
  const sheet2 = workbook.addWorksheet('Statistiques');

  // Titre
  sheet2.mergeCells('A1:B1');
  const titleCell = sheet2.getCell('A1');
  titleCell.value = 'Statistiques Commandes Clients';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  sheet2.getRow(1).height = 30;

  // Espacement
  sheet2.addRow([]);

  // Données stats
  const statsData = [
    ['Total Commandes', stats.total_orders],
    ["Chiffre d'Affaires HT", stats.total_ht],
    ['Total TVA', stats.total_tva],
    ["Chiffre d'Affaires TTC", stats.total_ttc],
    ['Panier Moyen', stats.average_basket],
    ['Commandes En Cours', stats.pending_orders],
    ['Commandes Expédiées', stats.shipped_orders],
  ];

  statsData.forEach(([label, value]) => {
    const row = sheet2.addRow([label, value]);

    // Styling label
    row.getCell(1).font = { bold: true };
    row.getCell(1).alignment = { horizontal: 'left' };

    // Styling valeur
    if (
      typeof value === 'number' &&
      label !== 'Total Commandes' &&
      label !== 'Commandes En Cours' &&
      label !== 'Commandes Expédiées'
    ) {
      row.getCell(2).numFmt = '#,##0.00 €';
    }
    row.getCell(2).alignment = { horizontal: 'right' };

    // Bordures
    row.eachCell({ includeEmpty: false }, cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      };
    });
  });

  // Largeur colonnes
  sheet2.getColumn(1).width = 30;
  sheet2.getColumn(2).width = 20;

  // Générer buffer
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
