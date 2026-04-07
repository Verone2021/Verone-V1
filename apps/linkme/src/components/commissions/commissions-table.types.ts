import type { FileText } from 'lucide-react';

import type { CommissionItem, CommissionStatus } from '../../types/analytics';

export const ITEMS_PER_PAGE = 15;

export type SortField = 'date' | 'order' | null;
export type SortDirection = 'asc' | 'desc';

export interface ICommissionsTableProps {
  commissions: CommissionItem[];
  isLoading?: boolean;
  onRequestPayment?: (selectedIds: string[]) => void;
  paymentRequestsCount?: number;
}

export interface TabDef {
  label: string;
  status: CommissionStatus | 'all' | 'requests';
  icon?: typeof FileText;
}
