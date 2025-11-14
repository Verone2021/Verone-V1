/**
 * Create Manual Shipment Modal
 * Modal pour créer une expédition manuelle (interne, sans Packlink)
 */

'use client';

import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

import { ManualShipmentForm } from '../forms/ManualShipmentForm';

interface CreateManualShipmentModalProps {
  salesOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateManualShipmentModal({
  salesOrderId,
  open,
  onOpenChange,
  onSuccess,
}: CreateManualShipmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    carrier_name: string;
    tracking_number?: string;
    notes?: string;
    estimated_delivery_at?: string;
  }) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/shipments/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order_id: salesOrderId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Erreur lors de la création');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[Modal] Create manual shipment error:', error);
      alert(
        `Erreur : ${error instanceof Error ? error.message : 'Erreur lors de la création'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une expédition manuelle</DialogTitle>
          <DialogDescription>
            Enregistrez une expédition sans passer par Packlink (suivi manuel).
          </DialogDescription>
        </DialogHeader>

        <ManualShipmentForm
          salesOrderId={salesOrderId}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
