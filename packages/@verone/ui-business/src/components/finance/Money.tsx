'use client';

import * as React from 'react';

import { cn } from '@verone/utils';

/**
 * Props pour le composant Money
 */
export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Montant à afficher */
  amount: number | string | null | undefined;
  /** Devise (défaut: EUR) */
  currency?: string;
  /** Locale pour le formatage (défaut: fr-FR) */
  locale?: string;
  /** Afficher le signe + pour les montants positifs */
  showPositiveSign?: boolean;
  /** Coloriser selon le signe (vert positif, rouge négatif) */
  colorize?: boolean;
  /** Taille du texte */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Afficher en gras */
  bold?: boolean;
  /** Texte à afficher si le montant est null/undefined */
  fallback?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

/**
 * Composant Money - Affiche un montant formaté avec devise
 *
 * @example
 * <Money amount={1234.56} /> // 1 234,56 €
 * <Money amount={-500} colorize /> // -500,00 € (en rouge)
 * <Money amount={1000} showPositiveSign colorize /> // +1 000,00 € (en vert)
 */
export function Money({
  amount,
  currency = 'EUR',
  locale = 'fr-FR',
  showPositiveSign = false,
  colorize = false,
  size = 'md',
  bold = false,
  fallback = '—',
  className,
  ...props
}: MoneyProps) {
  // Gérer les cas null/undefined
  if (amount === null || amount === undefined) {
    return (
      <span
        className={cn('text-muted-foreground', sizeClasses[size], className)}
        {...props}
      >
        {fallback}
      </span>
    );
  }

  // Convertir en nombre si string
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  // Gérer les NaN
  if (isNaN(numericAmount)) {
    return (
      <span
        className={cn('text-muted-foreground', sizeClasses[size], className)}
        {...props}
      >
        {fallback}
      </span>
    );
  }

  // Formater le montant
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formattedAmount = formatter.format(Math.abs(numericAmount));

  // Ajouter le signe
  if (numericAmount < 0) {
    formattedAmount = `-${formattedAmount}`;
  } else if (showPositiveSign && numericAmount > 0) {
    formattedAmount = `+${formattedAmount}`;
  }

  // Déterminer la couleur
  let colorClass = '';
  if (colorize) {
    if (numericAmount > 0) {
      colorClass = 'text-green-600 dark:text-green-400';
    } else if (numericAmount < 0) {
      colorClass = 'text-red-600 dark:text-red-400';
    }
  }

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        sizeClasses[size],
        colorClass,
        bold && 'font-semibold',
        className
      )}
      {...props}
    >
      {formattedAmount}
    </span>
  );
}

/**
 * Variante compacte du composant Money (sans décimales si entier)
 */
export function MoneyCompact({
  amount,
  currency = 'EUR',
  locale = 'fr-FR',
  className,
  ...props
}: Omit<MoneyProps, 'size'>) {
  if (amount === null || amount === undefined) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  // Pas de décimales si entier
  const hasDecimals = numericAmount % 1 !== 0;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });

  return (
    <span className={cn('font-mono tabular-nums', className)} {...props}>
      {formatter.format(numericAmount)}
    </span>
  );
}
