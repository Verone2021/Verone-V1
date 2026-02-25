'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { HelpCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  /** Texte d'aide affiché dans le tooltip */
  content: string;
  /** Position du tooltip (default: top) */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Taille de l'icone en classes Tailwind (default: h-4 w-4) */
  iconClassName?: string;
  /** Classes additionnelles pour le wrapper */
  className?: string;
}

/**
 * Composant d'aide contextuelle avec icone `?`
 *
 * Utilise le Tooltip shadcn/ui existant dans @verone/ui.
 * Auto-wrappé dans TooltipProvider pour fonctionner partout.
 *
 * @example
 * <HelpTooltip content="Brouillon = visible uniquement par vous" />
 */
export function HelpTooltip({
  content,
  side = 'top',
  iconClassName,
  className,
}: HelpTooltipProps): JSX.Element {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full text-gray-400 hover:text-linkme-turquoise transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-linkme-turquoise/50',
              className
            )}
            aria-label="Aide"
          >
            <HelpCircle className={cn('h-4 w-4', iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-sm leading-relaxed"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
