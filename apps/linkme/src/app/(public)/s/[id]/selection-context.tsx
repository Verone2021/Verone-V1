'use client';

import { createContext, useContext } from 'react';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ISelectionItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  base_price_ht: number;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  stock_quantity: number;
  category_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  is_featured: boolean;
}

export interface ISelection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_id: string;
  published_at: string | null;
  created_at: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

export interface ICartItem extends ISelectionItem {
  quantity: number;
}

export interface IOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  postal_code: string | null;
  shipping_address_line1: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_type: string | null;
}

export interface IAffiliateInfo {
  role: string | null;
  enseigne_id: string | null;
  enseigne_name: string | null;
}

export interface ICategory {
  id: string;
  name: string;
  count: number;
  subcategories?: { id: string; name: string; count: number }[];
}

export const DEFAULT_BRANDING: IBranding = {
  primary_color: '#5DBEBB',
  secondary_color: '#3976BB',
  accent_color: '#7E84C0',
  text_color: '#183559',
  background_color: '#FFFFFF',
  logo_url: null,
};

// ============================================
// CONTEXT
// ============================================

export interface SelectionContextValue {
  selection: ISelection | null;
  items: ISelectionItem[];
  branding: IBranding;
  cart: ICartItem[];
  affiliateInfo: IAffiliateInfo | null;
  organisations: IOrganisation[];
  categories: ICategory[];
  isLoading: boolean;
  error: string | null;
  addToCart: (item: ISelectionItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  setCart: React.Dispatch<React.SetStateAction<ICartItem[]>>;
}

export const SelectionContext = createContext<SelectionContextValue | null>(
  null
);

/**
 * Hook pour accéder au contexte de sélection
 * Doit être utilisé dans un composant enfant de SelectionLayout
 */
export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionLayout');
  }
  return context;
}
