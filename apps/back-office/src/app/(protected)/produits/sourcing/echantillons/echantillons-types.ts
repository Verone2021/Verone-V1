/**
 * Types and helpers for the Échantillons page.
 * No business logic — pure type definitions and badge helpers.
 */

import type { UnifiedCustomer } from '@verone/orders';
import type { SelectedProduct } from '@verone/products';

// ---------------------------------------------------------------------------
// Re-exported types used across all echantillons modules
// ---------------------------------------------------------------------------

export type { UnifiedCustomer, SelectedProduct };

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

export interface SampleFormState {
  selectedCustomer: UnifiedCustomer | null;
  selectedProduct: SelectedProduct | null;
  selectedProductId: string;
  showProductModal: boolean;
  quantity: number;
  deliveryAddress: string;
  notes: string;
  submitting: boolean;
}

export interface DeleteConfirmState {
  deleteConfirmOpen: boolean;
  sampleToDelete: string | null;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface EchantillonFilters {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
}
