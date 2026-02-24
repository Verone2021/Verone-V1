'use client';

import * as React from 'react';

import { cn } from '@verone/utils';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * AnimatedNumber — Counter anime pour KPI cards
 * Utilise motion spring pour une animation fluide du 0 vers la valeur cible.
 */
export function AnimatedNumber({
  value,
  duration = 1,
  formatOptions,
  locale = 'fr-FR',
  className,
  prefix,
  suffix,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);

  const formatted = useTransform(motionValue, (latest: number) => {
    if (formatOptions) {
      return new Intl.NumberFormat(locale, formatOptions).format(latest);
    }
    // Default: format as integer or with 2 decimals if fractional
    if (Number.isInteger(value)) {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(Math.round(latest));
    }
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(latest);
  });

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.32, 0.72, 0, 1],
    });
    return () => controls.stop();
  }, [motionValue, value, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      <motion.span>{formatted}</motion.span>
      {suffix}
    </span>
  );
}
