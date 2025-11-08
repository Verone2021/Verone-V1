import * as React from 'react';

import { cn } from '@verone/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Variant de la zone de texte
   * @default "default"
   */
  variant?: 'default' | 'error' | 'success';

  /**
   * Message d'erreur (affiche automatiquement variant="error")
   */
  error?: string;

  /**
   * Message d'aide
   */
  helperText?: string;

  /**
   * Affiche le compteur de caractères
   */
  showCount?: boolean;

  /**
   * Auto-resize basé sur le contenu
   */
  autoResize?: boolean;

  /**
   * Nombre de lignes minimum (pour auto-resize)
   */
  minRows?: number;

  /**
   * Nombre de lignes maximum (pour auto-resize)
   */
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant = 'default',
      error,
      helperText,
      showCount,
      autoResize,
      minRows = 3,
      maxRows = 10,
      maxLength,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const actualVariant = error ? 'error' : variant;
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = React.useState(0);

    const variantClasses = {
      default: 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
      error: 'border-red-500 focus:border-red-600 focus:ring-red-500/20',
      success:
        'border-green-500 focus:border-green-600 focus:ring-green-500/20',
    };

    // Auto-resize functionality
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minRows, maxRows]);

    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (autoResize) {
        adjustHeight();
      }
      props.onChange?.(e);
    };

    return (
      <div className="w-full">
        <textarea
          className={cn(
            // Base styles
            'flex min-h-[80px] w-full rounded-lg border bg-white px-4 py-3',
            'transition-all duration-200',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            'resize-none',
            'text-sm',

            // Variant
            variantClasses[actualVariant],

            className
          )}
          ref={node => {
            textareaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          {...props}
        />

        {/* Footer avec compteur et messages */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex-1">
            {/* Error message */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Helper text */}
            {helperText && !error && (
              <p className="text-sm text-slate-500">{helperText}</p>
            )}
          </div>

          {/* Character count */}
          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs tabular-nums',
                charCount > maxLength * 0.9
                  ? 'text-orange-600'
                  : 'text-slate-500'
              )}
            >
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
