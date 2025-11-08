/**
 * Composant: SupplierSegmentBadge
 * Affiche un badge pour le segment stratégique d'un fournisseur
 *
 * Segments (standards CRM/ERP):
 * - 🎯 STRATEGIC: Fournisseurs stratégiques critiques pour les opérations
 * - ⚡ TACTICAL: Fournisseurs tactiques avec impact opérationnel significatif
 * - 📋 OPERATIONAL: Fournisseurs opérationnels pour besoins quotidiens
 * - 📦 COMMODITY: Fournisseurs commodité facilement remplaçables
 */

import React from 'react';

import { Target, Star, CheckCircle, Package } from 'lucide-react';

import { cn } from '@verone/utils';

// Type ENUM depuis database (standards CRM/ERP)
export type SupplierSegmentType =
  | 'STRATEGIC'
  | 'TACTICAL'
  | 'OPERATIONAL'
  | 'COMMODITY';

interface SupplierSegmentBadgeProps {
  segment: SupplierSegmentType | null | undefined;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

// Configuration des segments (standards CRM/ERP)
const SEGMENT_CONFIG: Record<
  SupplierSegmentType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  STRATEGIC: {
    label: 'Stratégique',
    icon: Target,
    bgColor: 'bg-accent-50',
    textColor: 'text-accent-700',
    borderColor: 'border-accent-200',
  },
  TACTICAL: {
    label: 'Tactique',
    icon: Star,
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-700',
    borderColor: 'border-primary-200',
  },
  OPERATIONAL: {
    label: 'Opérationnel',
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    textColor: 'text-success-700',
    borderColor: 'border-success-200',
  },
  COMMODITY: {
    label: 'Commodité',
    icon: Package,
    bgColor: 'bg-neutral-50',
    textColor: 'text-neutral-600',
    borderColor: 'border-neutral-200',
  },
};

// Configuration tailles
const SIZE_CONFIG = {
  sm: {
    container: 'px-2 py-0.5 gap-1',
    text: 'text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5',
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
  },
};

export function SupplierSegmentBadge({
  segment,
  size = 'sm',
  showIcon = true,
  className,
}: SupplierSegmentBadgeProps) {
  // Ne rien afficher si pas de segment
  if (!segment) {
    return null;
  }

  const config = SEGMENT_CONFIG[segment];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-md border font-medium',
        'transition-all duration-200',
        // Colors
        config.bgColor,
        config.textColor,
        config.borderColor,
        // Size
        sizeConfig.container,
        sizeConfig.text,
        // Custom className
        className
      )}
    >
      {showIcon && <Icon className={cn('flex-shrink-0', sizeConfig.icon)} />}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Variante: Badge avec tooltip explicatif (optionnel, pour future enhancement)
 */
export function SupplierSegmentBadgeWithTooltip({
  segment,
  size = 'sm',
  showIcon = true,
  className,
}: SupplierSegmentBadgeProps) {
  // Descriptions courtes pour tooltips (standards CRM/ERP)
  const DESCRIPTIONS: Record<SupplierSegmentType, string> = {
    STRATEGIC: 'Fournisseurs critiques pour les opérations essentielles',
    TACTICAL: 'Impact opérationnel significatif, partenaires importants',
    OPERATIONAL: 'Besoins quotidiens et achats routiniers',
    COMMODITY: 'Produits standards, facilement remplaçables',
  };

  if (!segment) {
    return null;
  }

  return (
    <span title={DESCRIPTIONS[segment]} className="cursor-help">
      <SupplierSegmentBadge
        segment={segment}
        size={size}
        showIcon={showIcon}
        className={className}
      />
    </span>
  );
}
