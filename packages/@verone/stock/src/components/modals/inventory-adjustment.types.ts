import type { ReasonCode } from '../../hooks/core/use-stock-core';
import type { StockReasonCode } from '../../hooks';

/**
 * Mapping StockReasonCode (détaillé) → ReasonCode (simplifié use-stock-core)
 */
export const _REASON_CODE_MAPPING: Record<StockReasonCode, ReasonCode> = {
  sale: 'sale',
  transfer_out: 'transfer_out',
  damage_transport: 'damage',
  damage_handling: 'damage',
  damage_storage: 'damage',
  theft: 'damage',
  loss_unknown: 'damage',
  sample_client: 'sample',
  sample_showroom: 'sample',
  marketing_event: 'sample',
  photography: 'sample',
  rd_testing: 'sample',
  prototype: 'sample',
  quality_control: 'sample',
  return_supplier: 'return_supplier',
  return_customer: 'return_customer',
  warranty_replacement: 'return_customer',
  inventory_correction: 'adjustment',
  write_off: 'adjustment',
  obsolete: 'adjustment',
  purchase_reception: 'purchase',
  return_from_client: 'return_customer',
  found_inventory: 'adjustment',
  manual_adjustment: 'adjustment',
};

export interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
  } | null;
}

export type AdjustmentType = 'increase' | 'decrease' | 'correction';

export interface AdjustmentFormData {
  adjustmentType: AdjustmentType;
  quantity: string;
  reasonCode: StockReasonCode | '';
  notes: string;
  uploadedFile: File | null;
  uploadedFileUrl: string;
}

export const INCREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'found_inventory', label: 'Trouvaille inventaire' },
  { code: 'manual_adjustment', label: 'Ajustement manuel' },
  { code: 'return_from_client', label: 'Retour client' },
  { code: 'purchase_reception', label: 'Réception fournisseur' },
];

export const DECREASE_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'damage_transport', label: 'Casse transport' },
  { code: 'damage_handling', label: 'Casse manipulation' },
  { code: 'damage_storage', label: 'Dégradation stockage' },
  { code: 'theft', label: 'Vol/Disparition' },
  { code: 'loss_unknown', label: 'Perte inexpliquée' },
  { code: 'write_off', label: 'Mise au rebut' },
  { code: 'obsolete', label: 'Produit obsolète' },
];

export const CORRECTION_REASONS: { code: StockReasonCode; label: string }[] = [
  { code: 'inventory_correction', label: 'Correction inventaire' },
];
