'use client';

import {
  Info,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Truck,
  Package,
} from 'lucide-react';

export interface CompleteProductWizardProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  editMode?: boolean;
  draftId?: string;
}

export interface WizardFormData {
  // Informations générales - REFACTORISÉ selon nouvelle logique
  name: string;
  slug: string;
  description: string;
  selling_points: string[];
  condition: string;
  availability_type: string;
  video_url: string;

  // Catégorisation
  family_id: string;
  category_id: string;
  subcategory_id: string;

  // Fournisseur et sourcing
  supplier_id: string;
  supplier_page_url: string;
  supplier_reference: string;

  // Tarification et coûts - REFACTORISÉ logique prix minimum
  cost_price: string;
  target_margin_percentage: string;
  margin_percentage: string;

  // Caractéristiques techniques
  manufacturer: string;
  variant_attributes: Record<string, unknown>;
  dimensions: Record<string, unknown>;
  weight: string;
  gtin: string;

  // Type et assignation
  product_type: 'standard' | 'custom';
  assigned_client_id: string;
  creation_mode: 'sourcing' | 'complete';
  requires_sample: boolean;

  // Stock et inventaire
  stock_quantity: string;
  stock_real: string;
  stock_forecasted_in: string;
  stock_forecasted_out: string;
  min_stock: string;
  reorder_point: string;

  // Métadonnées (lecture seule)
  sku?: string;
  status?: string;
  archived_at?: string;
}

export const DEFAULT_FORM_DATA: WizardFormData = {
  name: '',
  slug: '',
  description: '',
  selling_points: [],
  condition: 'new',
  availability_type: 'normal',
  video_url: '',
  family_id: '',
  category_id: '',
  subcategory_id: '',
  supplier_id: '',
  supplier_page_url: '',
  supplier_reference: '',
  cost_price: '',
  target_margin_percentage: '',
  margin_percentage: '',
  manufacturer: '',
  variant_attributes: {},
  dimensions: {},
  weight: '',
  gtin: '',
  product_type: 'standard',
  assigned_client_id: '',
  creation_mode: 'complete',
  requires_sample: false,
  stock_quantity: '',
  stock_real: '',
  stock_forecasted_in: '',
  stock_forecasted_out: '',
  min_stock: '',
  reorder_point: '',
};

export const WIZARD_SECTIONS = [
  { id: 'general', label: 'Informations générales', icon: Info },
  { id: 'supplier', label: 'Fournisseur', icon: Truck },
  { id: 'pricing', label: 'Tarification', icon: DollarSign },
  { id: 'technical', label: 'Caractéristiques', icon: Settings },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'stock', label: 'Stock', icon: Package },
];
