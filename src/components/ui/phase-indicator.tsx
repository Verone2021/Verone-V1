/**
 * 🚀 Phase Indicator Component - Déploiement Progressif
 *
 * Composant pour afficher les indicateurs de phase pour les modules inactifs
 * Phase 1: Modules actifs
 * Phase 2+: Modules "Bientôt disponible" avec indicateurs visuels
 */

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Lock, Clock, Zap } from 'lucide-react';

import {
  getModulePhase,
  getModuleDeploymentStatus,
  PHASE_LABELS,
  PHASE_COLORS,
} from '@verone/utils/feature-flags';

interface PhaseIndicatorProps {
  moduleName: string;
  className?: string;
  variant?: 'badge' | 'full' | 'icon-only';
  showIcon?: boolean;
}

export function PhaseIndicator({
  moduleName,
  className,
  variant = 'badge',
  showIcon = true,
}: PhaseIndicatorProps) {
  const phase = getModulePhase(moduleName);
  const status = getModuleDeploymentStatus(moduleName);

  // Ne rien afficher si le module est actif
  if (status === 'active') {
    return null;
  }

  const getIcon = () => {
    switch (status) {
      case 'coming-soon':
        return <Clock className="w-3 h-3" />;
      case 'disabled':
        return <Lock className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getLabel = () => {
    if (phase > 0) {
      return PHASE_LABELS[phase as keyof typeof PHASE_LABELS];
    }
    return 'Bientôt disponible';
  };

  const colorClass = PHASE_COLORS[status] || PHASE_COLORS['coming-soon'];

  if (variant === 'icon-only') {
    return (
      <div className={cn('flex items-center', className)}>{getIcon()}</div>
    );
  }

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
          colorClass,
          className
        )}
      >
        {showIcon && getIcon()}
        <span>{getLabel()}</span>
      </div>
    );
  }

  // Variant 'badge' (default)
  return (
    <Badge
      variant="secondary"
      className={cn('flex items-center gap-1 text-xs', colorClass, className)}
    >
      {showIcon && getIcon()}
      {getLabel()}
    </Badge>
  );
}

/**
 * Composant pour wrapper les modules inactifs avec indicateur et désactivation
 */
interface InactiveModuleWrapperProps {
  moduleName: string;
  children: React.ReactNode;
  className?: string;
  showTooltip?: boolean;
}

export function InactiveModuleWrapper({
  moduleName,
  children,
  className,
  showTooltip = true,
}: InactiveModuleWrapperProps) {
  const status = getModuleDeploymentStatus(moduleName);
  const phase = getModulePhase(moduleName);

  if (status === 'active') {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative opacity-60 cursor-not-allowed', className)}>
      {/* Overlay pour désactiver l'interaction */}
      <div className="absolute inset-0 z-10 bg-transparent" />

      {/* Contenu original */}
      <div className="pointer-events-none">{children}</div>

      {/* Indicateur de phase */}
      <div className="absolute top-1 right-1 z-20">
        <PhaseIndicator
          moduleName={moduleName}
          variant="badge"
          className="shadow-sm"
        />
      </div>

      {/* Tooltip (optionnel) */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity duration-200 z-30 whitespace-nowrap">
          {phase > 0
            ? `Disponible en ${PHASE_LABELS[phase as keyof typeof PHASE_LABELS]}`
            : 'Bientôt disponible'}
        </div>
      )}
    </div>
  );
}
