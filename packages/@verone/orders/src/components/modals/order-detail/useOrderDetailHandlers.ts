'use client';

import { createClient } from '@verone/utils/supabase/client';
import type {
  SalesOrder,
  ManualPaymentType,
  OrderPayment,
} from '@verone/orders/hooks';
import { isOrderLocked as isOrderLockedFn } from '../../../validators/order-status';
import type { ILinkedInvoice } from './OrderInvoicingCard';

export interface OrderDetailHandlersInput {
  order: SalesOrder;
  readOnly: boolean;
  linkedInvoices: ILinkedInvoice[];
  orderPayments: OrderPayment[];
  existingLinks: Array<{ allocated_amount: number }>;
  manualPaymentType: ManualPaymentType;
  manualPaymentAmount: string;
  manualPaymentDate: string;
  manualPaymentRef: string;
  manualPaymentNote: string;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
  setFeesSaving: (v: boolean) => void;
  setManualPaymentType: (v: ManualPaymentType) => void;
  setManualPaymentAmount: (v: string) => void;
  setManualPaymentDate: (v: string) => void;
  setManualPaymentRef: (v: string) => void;
  setManualPaymentNote: (v: string) => void;
  setShowPaymentDialog: (v: boolean) => void;
  setOrderPayments: (v: OrderPayment[]) => void;
  setDeletingPaymentId: (v: string | null) => void;
  setPaymentSubmitting: (v: boolean) => void;
  markAsManuallyPaid: (
    orderId: string,
    type: ManualPaymentType,
    amount: number,
    options?: { reference?: string; note?: string; date?: Date }
  ) => Promise<unknown>;
  fetchOrderPayments: (orderId: string) => Promise<OrderPayment[]>;
  deleteManualPayment: (paymentId: string) => Promise<unknown>;
  onUpdate?: () => void;
}

export interface OrderDetailHandlersOutput {
  // Derived values
  remainingAmount: number;
  canMarkAsPaid: boolean;
  canShip: boolean;
  activeInvoices: ILinkedInvoice[];
  hasActiveInvoice: boolean;
  isLocked: boolean;
  manualTotal: number;
  linksTotal: number;
  totalPaid: number;
  orderTotalTtc: number;
  unifiedRemaining: number;
  // Handlers
  openPaymentDialog: () => void;
  refreshPayments: () => void;
  handleDeletePayment: (paymentId: string) => void;
  saveFees: () => Promise<void>;
  handleSubmitManualPayment: () => void;
}

export function useOrderDetailHandlers(
  input: OrderDetailHandlersInput
): OrderDetailHandlersOutput {
  const {
    order,
    readOnly,
    linkedInvoices,
    orderPayments,
    existingLinks,
    manualPaymentType,
    manualPaymentAmount,
    manualPaymentDate,
    manualPaymentRef,
    manualPaymentNote,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    setFeesSaving,
    setManualPaymentType,
    setManualPaymentAmount,
    setManualPaymentDate,
    setManualPaymentRef,
    setManualPaymentNote,
    setShowPaymentDialog,
    setOrderPayments,
    setDeletingPaymentId,
    setPaymentSubmitting,
    markAsManuallyPaid,
    fetchOrderPayments,
    deleteManualPayment,
    onUpdate,
  } = input;

  const remainingAmount = Math.max(
    0,
    (order.total_ttc ?? 0) - (order.paid_amount ?? 0)
  );

  const canMarkAsPaid =
    ['validated', 'partially_shipped', 'shipped'].includes(order.status) &&
    order.payment_status_v2 !== 'paid';

  const canShip = ['validated', 'partially_shipped'].includes(order.status);

  const activeInvoices = linkedInvoices.filter(
    inv => inv.status !== 'cancelled'
  );
  const hasActiveInvoice = activeInvoices.length > 0;

  const isLocked =
    readOnly || isOrderLockedFn(order.status) || hasActiveInvoice;

  const manualTotal = orderPayments.reduce((sum, p) => sum + p.amount, 0);
  const linksTotal = existingLinks.reduce(
    (sum, l) => sum + l.allocated_amount,
    0
  );
  const totalPaid = manualTotal + linksTotal;
  const orderTotalTtc = Math.abs(order.total_ttc || 0);
  const unifiedRemaining = Math.max(0, orderTotalTtc - totalPaid);

  const openPaymentDialog = () => {
    setManualPaymentType('card');
    setManualPaymentAmount(
      remainingAmount > 0
        ? remainingAmount.toFixed(2)
        : Math.abs(order.total_ttc ?? 0).toFixed(2)
    );
    setManualPaymentDate(
      (order.order_date ?? order.created_at ?? new Date().toISOString()).split(
        'T'
      )[0]
    );
    setManualPaymentRef('');
    setManualPaymentNote('');
    setShowPaymentDialog(true);
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
  };

  const refreshPayments = () => {
    void fetchOrderPayments(order.id)
      .then(setOrderPayments)
      .catch(console.error);
    onUpdate?.();
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    void deleteManualPayment(paymentId)
      .then(() => {
        refreshPayments();
      })
      .catch(console.error)
      .finally(() => setDeletingPaymentId(null));
  };

  const saveFees = async () => {
    setFeesSaving(true);
    const supabase = createClient();
    await supabase
      .from('sales_orders')
      .update({
        shipping_cost_ht: shippingCostHt,
        handling_cost_ht: handlingCostHt,
        insurance_cost_ht: insuranceCostHt,
        fees_vat_rate: feesVatRate,
      })
      .eq('id', order.id);
    setFeesSaving(false);
    onUpdate?.();
  };

  const handleSubmitManualPayment = () => {
    setPaymentSubmitting(true);
    void markAsManuallyPaid(
      order.id,
      manualPaymentType,
      parseFloat(manualPaymentAmount),
      {
        reference: manualPaymentRef || undefined,
        note: manualPaymentNote || undefined,
        date: manualPaymentDate ? new Date(manualPaymentDate) : undefined,
      }
    )
      .then(() => {
        refreshPayments();
        setManualPaymentAmount(
          Math.max(
            0,
            unifiedRemaining - parseFloat(manualPaymentAmount || '0')
          ).toFixed(2)
        );
        setManualPaymentRef('');
        setManualPaymentNote('');
      })
      .catch((err: unknown) => {
        console.error('[OrderDetailModal] Manual payment failed:', err);
      })
      .finally(() => setPaymentSubmitting(false));
  };

  return {
    remainingAmount,
    canMarkAsPaid,
    canShip,
    activeInvoices,
    hasActiveInvoice,
    isLocked,
    manualTotal,
    linksTotal,
    totalPaid,
    orderTotalTtc,
    unifiedRemaining,
    openPaymentDialog,
    refreshPayments,
    handleDeletePayment,
    saveFees,
    handleSubmitManualPayment,
  };
}
