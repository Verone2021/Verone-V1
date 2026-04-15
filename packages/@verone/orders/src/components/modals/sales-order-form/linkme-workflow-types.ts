import type { AffiliateType } from '@verone/orders/hooks/linkme/use-linkme-affiliates';
import type { SelectionItem } from '@verone/orders/hooks/linkme/use-linkme-selections';

import type { LinkMeCartItem, LinkMeCartTotals } from './LinkMeCartTable';

export interface LinkMeAffiliate {
  id: string;
  display_name: string;
  enseigne_id: string | null;
  selections_count: number;
}

export interface LinkMeSelection {
  id: string;
  name: string;
  products_count?: number | null;
  affiliate_name?: string;
}

export interface LinkMeSelectionDetail {
  name?: string;
  affiliate_id?: string;
  items?: SelectionItem[];
}

export interface PreviewSelection {
  name?: string;
  items?: SelectionItem[];
}

export interface LinkMeWorkflowProps {
  affiliateType: AffiliateType | null;
  onAffiliateTypeChange: (type: AffiliateType) => void;
  affiliateId: string | null;
  onAffiliateIdChange: (id: string | null) => void;
  affiliates: LinkMeAffiliate[] | undefined;
  loadingAffiliates: boolean;
  selectionId: string | null;
  onSelectionIdChange: (id: string | null) => void;
  selections: LinkMeSelection[] | undefined;
  loadingSelections: boolean;
  selectionDetail: LinkMeSelectionDetail | null | undefined;
  loadingSelectionDetail: boolean;
  cart: LinkMeCartItem[];
  cartTotals: LinkMeCartTotals;
  onAddProduct: (item: SelectionItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  previewSelection: PreviewSelection | null | undefined;
  previewLoading: boolean;
}
