import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Variant du champ
   * @default "default"
   */
  variant?: "default" | "error" | "success"

  /**
   * Taille du champ
   * @default "md"
   */
  inputSize?: "sm" | "md" | "lg"

  /**
   * Icône à gauche du champ
   */
  iconLeft?: React.ReactNode

  /**
   * Icône à droite du champ
   */
  iconRight?: React.ReactNode

  /**
   * Message d'erreur (affiche automatiquement variant="error")
   */
  error?: string

  /**
   * Message d'aide
   */
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant = "default",
      inputSize = "md",
      iconLeft,
      iconRight,
      error,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    const actualVariant = error ? "error" : variant

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-4 text-base",
    }

    const variantClasses = {
      default: "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
      error: "border-red-500 focus:border-red-600 focus:ring-red-500/20",
      success: "border-green-500 focus:border-green-600 focus:ring-green-500/20",
    }

    return (
      <div className="w-full">
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {iconLeft}
            </div>
          )}

          <input
            type={type}
            className={cn(
              // Base styles
              "flex w-full rounded-lg border bg-white",
              "transition-all duration-200",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",

              // Size
              sizeClasses[inputSize],

              // Variant
              variantClasses[actualVariant],

              // Icon padding
              iconLeft && "pl-10",
              iconRight && "pr-10",

              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {iconRight}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
