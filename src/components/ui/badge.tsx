import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-white hover:bg-slate-800",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning:
          "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
        danger:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        outline: "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Affiche un point indicateur à gauche
   */
  dot?: boolean

  /**
   * Couleur personnalisée du point
   */
  dotColor?: string

  /**
   * Icône à afficher
   */
  icon?: React.ReactNode

  /**
   * Permet de fermer le badge
   */
  onRemove?: () => void
}

function Badge({
  className,
  variant,
  size,
  dot,
  dotColor,
  icon,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: dotColor || "currentColor",
          }}
        />
      )}

      {icon && <span className="flex-shrink-0">{icon}</span>}

      {children}

      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 flex-shrink-0 rounded-full hover:bg-black/10 p-0.5 transition-colors"
          aria-label="Retirer"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
