'use client';

import React from 'react';

import { UniversalOrderDetailsModal as BaseModal } from '@verone/orders/components/modals/UniversalOrderDetailsModal';
import type { OrderItem } from '@verone/orders/hooks';

import { PaymentSection } from '@/components/orders/PaymentSection';

interface Props {
  orderId: string | null;
  orderType: 'sales' | 'purchase' | null;
  open: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
  onUpdate?: () => void;
}

export function UniversalOrderDetailsModal(props: Props) {
  return (
    <BaseModal
      {...props}
      renderActions={order => (
        <div className="px-1 pb-4">
          <PaymentSection
            orderId={order.id}
            orderNumber={order.order_number}
            orderStatus={order.status}
            totalHt={order.total_ht}
            totalTtc={order.total_ttc}
            taxRate={order.tax_rate}
            currency={order.currency}
            paymentTerms={order.payment_terms}
            paymentStatus={order.payment_status}
            customerName={order.customer_name}
            customerEmail={order.customer_email}
            customerType={order.customer_type}
            shippingCostHt={order.shipping_cost_ht}
            handlingCostHt={order.handling_cost_ht}
            insuranceCostHt={order.insurance_cost_ht}
            feesVatRate={order.fees_vat_rate}
            orderItems={order.items.map((item: OrderItem) => ({
              id: item.id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: order.tax_rate,
              products: item.products
                ? { name: String(item.products.name ?? '') }
                : null,
            }))}
          />
        </div>
      )}
    />
  );
}
