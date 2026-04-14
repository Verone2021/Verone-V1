export type DatePreset = '1m' | '2m' | '3m' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PerformanceFilters {
  dateRange: DateRange;
  affiliateId?: string;
  selectionId?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  quantitySold: number;
  totalRevenueHT: number;
  ordersCount: number;
}

export interface AffiliateListItem {
  id: string;
  displayName: string;
  slug: string;
  ordersCount: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
}

export interface SelectionListItem {
  id: string;
  name: string;
  slug: string;
  affiliateId: string;
  affiliateName: string;
  ordersCount: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
  productsCount: number;
}

export interface PerformanceData {
  averageBasket: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
  totalOrders: number;
  topProducts: TopProduct[];
  affiliates: AffiliateListItem[];
  selections: SelectionListItem[];
  affiliateName?: string;
  selectionName?: string;
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const endDate = new Date();
  const startDate = new Date();
  switch (preset) {
    case '1m':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '2m':
      startDate.setMonth(startDate.getMonth() - 2);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  return { startDate, endDate };
}

export function formatDateRange(dateRange: DateRange): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return `${dateRange.startDate.toLocaleDateString('fr-FR', options)} - ${dateRange.endDate.toLocaleDateString('fr-FR', options)}`;
}
