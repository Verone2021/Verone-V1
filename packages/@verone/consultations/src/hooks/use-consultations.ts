'use client';

// Re-exports
export { useConsultations } from './use-consultations-list';
export { useConsultationItems } from './use-consultation-items';
export type {
  ClientConsultation,
  ConsultationProduct,
  ConsultationItem,
  CreateConsultationData,
  AssignProductData,
  CreateConsultationItemData,
  UpdateConsultationItemData,
  ConsultationFilters,
} from './consultations-types';

// Hook DÉPRÉCIÉ - utilisez useConsultationItems à la place
// Conservé pour rétrocompatibilité
import type {
  AssignProductData,
  ConsultationProduct,
} from './consultations-types';
import { useConsultationItems } from './use-consultation-items';

export function useConsultationProducts(consultationId?: string) {
  console.warn(
    'useConsultationProducts est déprécié. Utilisez useConsultationItems à la place.'
  );

  const {
    consultationItems,
    eligibleProducts,
    loading,
    error,
    addItem,
    removeItem,
    updateItem,
  } = useConsultationItems(consultationId);

  const consultationProducts = consultationItems.map(item => ({
    id: item.id,
    consultation_id: item.consultation_id,
    product_id: item.product_id,
    proposed_price: item.unit_price,
    notes: item.notes,
    is_primary_proposal: false,
    quantity: item.quantity,
    is_free: item.is_free,
    created_at: item.created_at,
    created_by: item.created_by,
    product: item.product,
  }));

  return {
    consultationProducts,
    eligibleProducts,
    loading,
    error,
    fetchConsultationProducts: (_id: string) => {}, // Noop
    fetchEligibleProducts: () => {}, // Noop
    assignProduct: async (data: AssignProductData) => {
      return addItem({
        consultation_id: data.consultation_id,
        product_id: data.product_id,
        quantity: data.quantity ?? 1,
        unit_price: data.proposed_price,
        is_free: data.is_free ?? false,
        notes: data.notes,
      });
    },
    removeProduct: removeItem,
    updateConsultationProduct: async (
      id: string,
      updates: Partial<ConsultationProduct>
    ) => {
      return updateItem(id, {
        quantity: updates.quantity,
        unit_price: updates.proposed_price,
        is_free: updates.is_free,
        notes: updates.notes,
      });
    },
  };
}
