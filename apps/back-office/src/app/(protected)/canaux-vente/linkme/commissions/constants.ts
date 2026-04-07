import type React from 'react';

import {
  Clock,
  Banknote,
  Hourglass,
  CheckCircle,
  ArrowRightCircle,
  CreditCard,
} from 'lucide-react';

import type { TabType } from './types';

// ============================================
// TABS CONFIGURATION
// ============================================

export const TABS_CONFIG: Record<
  TabType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
  }
> = {
  en_attente: {
    label: 'En attente',
    icon: Clock,
    description: 'Commandes non payées par le client',
    color: 'text-orange-600',
  },
  payables: {
    label: 'Payables',
    icon: Banknote,
    description: 'Commissions à percevoir',
    color: 'text-green-600',
  },
  en_cours: {
    label: 'En cours de règlement',
    icon: Hourglass,
    description: 'Demandes de paiement en attente',
    color: 'text-blue-600',
  },
  payees: {
    label: 'Payées',
    icon: CheckCircle,
    description: 'Commissions versées',
    color: 'text-emerald-600',
  },
};

// ============================================
// STATUS CONFIG
// ============================================

export const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
  },
  validated: {
    label: 'Payable',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  requested: {
    label: 'Demandée',
    variant: 'secondary' as const,
    icon: ArrowRightCircle,
  },
  paid: {
    label: 'Payée',
    variant: 'default' as const,
    icon: CreditCard,
  },
};
