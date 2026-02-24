'use client';

import * as React from 'react';

import { cn } from '@verone/utils';
import { ExternalLink } from 'lucide-react';

export interface ClickableCellProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Hide the external link icon */
  hideIcon?: boolean;
}

/**
 * ClickableCell - Cellule cliquable standardisée pour les tableaux.
 *
 * Affiche le contenu avec une icône ExternalLink subtile
 * pour indiquer visuellement que l'élément est cliquable.
 */
const ClickableCell = React.forwardRef<HTMLButtonElement, ClickableCellProps>(
  ({ className, children, hideIcon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 text-left text-primary hover:underline cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
        {!hideIcon && <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />}
      </button>
    );
  }
);
ClickableCell.displayName = 'ClickableCell';

export { ClickableCell };
