'use client';

import React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

/**
 * ButtonUnified - Composant bouton générique unifié Design System V2
 *
 * Architecture 2025 : CVA + Radix UI + Tailwind CSS
 * Remplace : ActionButton, ModernActionButton, StandardModifyButton, ButtonV2
 *
 * Fonctionnalités unifiées :
 * - 8 variants : default, destructive, outline, secondary, ghost, link, gradient, glass
 * - 5 sizes : xs, sm, md, lg, xl
 * - Support icônes : left/right position
 * - État loading avec spinner
 * - Polymorphic avec asChild (Radix Slot)
 * - Microinteractions : hover scale, transitions
 * - Accessibilité WCAG 2.2 AA
 *
 * Inspirations : shadcn/ui, Vercel, Linear, Stripe
 *
 * @example
 * ```tsx
 * // Bouton primaire standard
 * <ButtonUnified>Enregistrer</ButtonUnified>
 *
 * // Bouton avec icône gauche
 * <ButtonUnified icon={Save} iconPosition="left">
 *   Enregistrer
 * </ButtonUnified>
 *
 * // Bouton destructif avec loading
 * <ButtonUnified variant="destructive" loading={isDeleting}>
 *   Supprimer
 * </ButtonUnified>
 *
 * // Bouton outline small
 * <ButtonUnified variant="outline" size="sm" icon={Edit}>
 *   Modifier
 * </ButtonUnified>
 *
 * // Bouton gradient glass (moderne)
 * <ButtonUnified variant="gradient">Nouveau produit</ButtonUnified>
 * <ButtonUnified variant="glass">Dashboard</ButtonUnified>
 *
 * // Polymorphic : render as Link
 * <ButtonUnified asChild>
 *   <Link href="/products">Voir produits</Link>
 * </ButtonUnified>
 * ```
 *
 * @see https://ui.shadcn.com/docs/components/button
 * @see /docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md
 */

const buttonVariants = cva(
  // Base styles (toujours appliqués)
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-secondary',
        ghost:
          'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
        // Variants modernes 2025
        gradient:
          'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-blue-500',
        glass:
          'backdrop-blur-lg bg-white/10 border border-white/20 text-white shadow-lg hover:bg-white/20 focus-visible:ring-white',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        xl: 'h-12 px-10 text-base',
        icon: 'h-10 w-10', // Bouton carré pour icône seule
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonUnifiedProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child component (polymorphic pattern)
   * @example
   * <ButtonUnified asChild>
   *   <Link href="/home">Home</Link>
   * </ButtonUnified>
   */
  asChild?: boolean;
  /**
   * Icône Lucide à afficher
   */
  icon?: LucideIcon;
  /**
   * Position de l'icône
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
  /**
   * État loading : affiche un spinner et désactive le bouton
   */
  loading?: boolean;
}

const ButtonUnified = React.forwardRef<HTMLButtonElement, ButtonUnifiedProps>(
  (
    {
      className,
      variant,
      size,
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // Taille icône selon size du bouton
    const iconSizeMap = {
      xs: 14,
      sm: 16,
      md: 16,
      lg: 18,
      xl: 20,
      icon: 18,
    };
    const iconSize = iconSizeMap[size || 'md'];

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={iconSize} />}

        {!loading && Icon && iconPosition === 'left' && (
          <Icon size={iconSize} strokeWidth={2} />
        )}

        {children}

        {!loading && Icon && iconPosition === 'right' && (
          <Icon size={iconSize} strokeWidth={2} />
        )}
      </Comp>
    );
  }
);

ButtonUnified.displayName = 'ButtonUnified';

export { ButtonUnified, buttonVariants };
