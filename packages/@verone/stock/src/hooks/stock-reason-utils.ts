import type { StockReasonCode } from './stock-movements-types';

const REASON_DESCRIPTIONS: Record<StockReasonCode, string> = {
  sale: 'Vente client',
  transfer_out: 'Transfert sortant',
  damage_transport: 'Casse transport',
  damage_handling: 'Casse manipulation',
  damage_storage: 'Dégradation stockage',
  theft: 'Vol/Disparition',
  loss_unknown: 'Perte inexpliquée',
  sample_client: 'Échantillon client',
  sample_showroom: 'Échantillon showroom',
  marketing_event: 'Événement marketing',
  photography: 'Séance photo',
  rd_testing: 'Tests R&D',
  prototype: 'Prototype',
  quality_control: 'Contrôle qualité',
  return_supplier: 'Retour fournisseur',
  return_customer: 'Retour client SAV',
  warranty_replacement: 'Remplacement garantie',
  inventory_correction: 'Correction inventaire',
  write_off: 'Mise au rebut',
  obsolete: 'Produit obsolète',
  purchase_reception: 'Réception fournisseur',
  return_from_client: 'Retour client',
  found_inventory: 'Trouvaille inventaire',
  manual_adjustment: 'Ajustement manuel',
};

export function getReasonDescription(reasonCode: StockReasonCode): string {
  return REASON_DESCRIPTIONS[reasonCode] ?? 'Motif inconnu';
}

export function getReasonsByCategory() {
  return {
    sorties_normales: [
      { code: 'sale' as StockReasonCode, label: 'Vente client' },
      { code: 'transfer_out' as StockReasonCode, label: 'Transfert sortant' },
    ],
    pertes_degradations: [
      { code: 'damage_transport' as StockReasonCode, label: 'Casse transport' },
      {
        code: 'damage_handling' as StockReasonCode,
        label: 'Casse manipulation',
      },
      {
        code: 'damage_storage' as StockReasonCode,
        label: 'Dégradation stockage',
      },
      { code: 'theft' as StockReasonCode, label: 'Vol/Disparition' },
      { code: 'loss_unknown' as StockReasonCode, label: 'Perte inexpliquée' },
    ],
    usage_commercial: [
      { code: 'sample_client' as StockReasonCode, label: 'Échantillon client' },
      {
        code: 'sample_showroom' as StockReasonCode,
        label: 'Échantillon showroom',
      },
      {
        code: 'marketing_event' as StockReasonCode,
        label: 'Événement marketing',
      },
      { code: 'photography' as StockReasonCode, label: 'Séance photo' },
    ],
    rd_production: [
      { code: 'rd_testing' as StockReasonCode, label: 'Tests R&D' },
      { code: 'prototype' as StockReasonCode, label: 'Prototype' },
      { code: 'quality_control' as StockReasonCode, label: 'Contrôle qualité' },
    ],
    retours_sav: [
      {
        code: 'return_supplier' as StockReasonCode,
        label: 'Retour fournisseur',
      },
      {
        code: 'return_customer' as StockReasonCode,
        label: 'Retour client SAV',
      },
      {
        code: 'warranty_replacement' as StockReasonCode,
        label: 'Remplacement garantie',
      },
    ],
    ajustements: [
      {
        code: 'inventory_correction' as StockReasonCode,
        label: 'Correction inventaire',
      },
      { code: 'write_off' as StockReasonCode, label: 'Mise au rebut' },
      { code: 'obsolete' as StockReasonCode, label: 'Produit obsolète' },
    ],
    entrees_speciales: [
      {
        code: 'purchase_reception' as StockReasonCode,
        label: 'Réception fournisseur',
      },
      { code: 'return_from_client' as StockReasonCode, label: 'Retour client' },
      {
        code: 'found_inventory' as StockReasonCode,
        label: 'Trouvaille inventaire',
      },
      {
        code: 'manual_adjustment' as StockReasonCode,
        label: 'Ajustement manuel',
      },
    ],
  };
}
