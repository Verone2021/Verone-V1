'use client';

/**
 * OrderStepper - Sidebar de navigation pour le formulaire multi-étapes
 *
 * Affiche les 8 étapes avec :
 * - Numéro et label de chaque étape
 * - État (active, complétée, disabled)
 * - Indicateur visuel de progression
 *
 * @module OrderStepper
 * @since 2026-01-20
 * @updated 2026-01-24 - Refonte 7→8 étapes (séparation contacts)
 */

import { cn } from '@verone/ui';
import {
  Store,
  Package,
  ShoppingCart,
  User,
  FileText,
  MapPin,
  Truck,
  CheckCircle,
  ListChecks,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface OrderStep {
  id: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description?: string;
}

export interface OrderStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  className?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const ORDER_STEPS: OrderStep[] = [
  {
    id: 1,
    label: 'Restaurant',
    shortLabel: 'Restaurant',
    icon: Store,
    description: 'Existant ou nouveau',
  },
  {
    id: 2,
    label: 'Sélection',
    shortLabel: 'Sélection',
    icon: ListChecks,
    description: 'Choisir la sélection',
  },
  {
    id: 3,
    label: 'Produits',
    shortLabel: 'Produits',
    icon: Package,
    description: 'Ajouter des produits',
  },
  {
    id: 4,
    label: 'Panier',
    shortLabel: 'Panier',
    icon: ShoppingCart,
    description: 'Vérifier le panier',
  },
  {
    id: 5,
    label: 'Contact Responsable',
    shortLabel: 'Responsable',
    icon: User,
    description: 'Responsable de la commande',
  },
  {
    id: 6,
    label: 'Facturation',
    shortLabel: 'Facturation',
    icon: FileText,
    description: 'Contact et adresse de facturation',
  },
  {
    id: 7,
    label: 'Adresse de contact de livraison',
    shortLabel: 'Livraison',
    icon: MapPin,
    description: 'Contact livraison, adresse et options',
  },
  {
    id: 8,
    label: 'Validation',
    shortLabel: 'Validation',
    icon: CheckCircle,
    description: 'Récapitulatif final',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderStepper({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: OrderStepperProps) {
  const canNavigateTo = (step: number) => {
    // Peut naviguer vers les étapes complétées ou l'étape courante
    return completedSteps.includes(step) || step === currentStep || step < currentStep;
  };

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {ORDER_STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isClickable = canNavigateTo(step.id) && !!onStepClick;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isClickable && onStepClick?.(step.id)}
            disabled={!isClickable}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg text-left transition-all',
              'focus:outline-none focus:ring-2 focus:ring-linkme-turquoise/50',
              isActive && 'bg-linkme-turquoise/10 border border-linkme-turquoise/30',
              !isActive && isCompleted && 'bg-green-50 hover:bg-green-100',
              !isActive && !isCompleted && !isClickable && 'opacity-50 cursor-not-allowed',
              !isActive && !isCompleted && isClickable && 'hover:bg-gray-50',
            )}
          >
            {/* Indicateur numéroté */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                isActive && 'bg-linkme-turquoise text-white',
                !isActive && isCompleted && 'bg-green-500 text-white',
                !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
              )}
            >
              {isCompleted && !isActive ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive && 'text-linkme-turquoise',
                    !isActive && isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'font-medium truncate',
                    isActive && 'text-linkme-turquoise',
                    !isActive && isCompleted && 'text-green-700',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {step.description && (
                <p
                  className={cn(
                    'text-xs mt-0.5 truncate',
                    isActive && 'text-linkme-turquoise/70',
                    !isActive && 'text-gray-400'
                  )}
                >
                  {step.description}
                </p>
              )}
            </div>
          </button>
        );
      })}

      {/* Barre de progression */}
      <div className="mt-4 px-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progression</span>
          <span>
            {completedSteps.length}/{ORDER_STEPS.length} étapes
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linkme-turquoise transition-all duration-300"
            style={{
              width: `${(completedSteps.length / ORDER_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </nav>
  );
}

export default OrderStepper;
