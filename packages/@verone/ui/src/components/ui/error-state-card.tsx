import * as React from 'react';

import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';

import { Button } from './button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const errorStateVariants = cva('', {
  variants: {
    variant: {
      default: 'border-blue-200 bg-blue-50',
      destructive: 'border-red-200 bg-red-50',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const iconColorMap = {
  default: 'text-blue-600',
  destructive: 'text-red-600',
} as const;

const titleColorMap = {
  default: 'text-blue-900',
  destructive: 'text-red-900',
} as const;

const messageColorMap = {
  default: 'text-blue-700',
  destructive: 'text-red-700',
} as const;

export interface ErrorStateCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof errorStateVariants> {
  /**
   * Titre de l'erreur (optionnel)
   * @default "Erreur"
   */
  title?: string;

  /**
   * Message d'erreur à afficher
   */
  message: string;

  /**
   * Callback pour réessayer l'action
   */
  onRetry?: () => void;

  /**
   * Variant visuel de la card
   * - default: style information (bleu)
   * - destructive: style erreur (rouge)
   * @default "default"
   */
  variant?: 'default' | 'destructive';
}

/**
 * ErrorStateCard
 *
 * Composant réutilisable pour afficher les états d'erreur
 * avec possibilité de réessayer l'action
 *
 * @example
 * ```tsx
 * <ErrorStateCard
 *   title="Échec de chargement"
 *   message="Impossible de charger les données"
 *   onRetry={() => refetch()}
 *   variant="destructive"
 * />
 * ```
 */
export const ErrorStateCard = React.forwardRef<
  HTMLDivElement,
  ErrorStateCardProps
>(
  (
    {
      title = 'Erreur',
      message,
      onRetry,
      variant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const iconColor = iconColorMap[variant || 'default'];
    const titleColor = titleColorMap[variant || 'default'];
    const messageColor = messageColorMap[variant || 'default'];

    return (
      <Card
        ref={ref}
        variant="flat"
        className={cn(errorStateVariants({ variant }), className)}
        {...props}
      >
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className={cn('h-5 w-5', iconColor)} />
            </div>
            <div className="flex-1">
              <CardTitle className={cn('text-base', titleColor)}>
                {title}
              </CardTitle>
              <CardDescription className={cn('mt-1', messageColor)}>
                {message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {onRetry && (
          <CardFooter className="pt-0">
            <Button
              onClick={onRetry}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              className="w-full sm:w-auto"
            >
              Réessayer
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }
);

ErrorStateCard.displayName = 'ErrorStateCard';
