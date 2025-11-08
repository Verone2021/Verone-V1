import * as React from 'react';

import { Info } from 'lucide-react';

import { cn } from '@verone/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Marque le champ comme requis avec un astérisque
   */
  required?: boolean;

  /**
   * Message tooltip d'aide
   */
  tooltip?: string;

  /**
   * État du champ associé
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Désactivé
   */
  disabled?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      children,
      required,
      tooltip,
      state = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const stateClasses = {
      default: 'text-slate-700',
      error: 'text-red-600',
      success: 'text-green-600',
    };

    return (
      <label
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium leading-none',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          stateClasses[state],
          disabled && 'cursor-not-allowed opacity-70',
          className
        )}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-red-500" aria-label="requis">
              *
            </span>
          )}
        </span>

        {tooltip && (
          <span
            className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-help"
            title={tooltip}
          >
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label };
