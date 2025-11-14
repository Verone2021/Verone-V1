/**
 * Shipment Status Badge
 * Badge affichant le statut d'une expédition selon shipped_at et delivered_at
 */

'use client';

import React from 'react';

import { Badge } from '@verone/ui';

interface Shipment {
  shipped_at: string | null;
  delivered_at: string | null;
  metadata?: {
    status?: string;
  } | null;
}

interface ShipmentStatusBadgeProps {
  shipment: Shipment;
}

function getShipmentStatus(shipment: Shipment) {
  // Livré
  if (shipment.delivered_at) {
    return {
      label: 'Livrée',
      variant: 'success' as const,
    };
  }

  // En cours (payée/expédiée)
  if (shipment.shipped_at) {
    return {
      label: 'En cours',
      variant: 'warning' as const,
    };
  }

  // Draft Packlink
  if (shipment.metadata?.status === 'DRAFT') {
    return {
      label: 'Brouillon',
      variant: 'secondary' as const,
    };
  }

  // En attente
  return {
    label: 'En attente',
    variant: 'default' as const,
  };
}

export function ShipmentStatusBadge({ shipment }: ShipmentStatusBadgeProps) {
  const status = getShipmentStatus(shipment);

  return <Badge variant={status.variant}>{status.label}</Badge>;
}
