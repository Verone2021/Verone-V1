import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white border-slate-200 text-slate-900",
        info: "bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600",
        success: "bg-green-50 border-green-200 text-green-900 [&>svg]:text-green-600",
        warning: "bg-orange-50 border-orange-200 text-orange-900 [&>svg]:text-orange-600",
        error: "bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600",
        destructive: "bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const variantIcons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  destructive: AlertCircle,
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Permet de fermer l'alerte
   */
  dismissible?: boolean

  /**
   * Callback quand l'alerte est fermée
   */
  onDismiss?: () => void

  /**
   * Icône personnalisée (sinon auto selon variant)
   */
  icon?: React.ReactNode

  /**
   * Masque l'icône
   */
  hideIcon?: boolean

  /**
   * Actions (boutons) à afficher
   */
  actions?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant,
      dismissible,
      onDismiss,
      icon,
      hideIcon,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false)

    const handleDismiss = () => {
      setDismissed(true)
      onDismiss?.()
    }

    if (dismissed) return null

    const IconComponent = variant ? variantIcons[variant] : variantIcons.default
    const showIcon = !hideIcon

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && (
          <div className="absolute left-4 top-4">
            {icon || <IconComponent className="h-5 w-5" />}
          </div>
        )}

        <div className={cn(showIcon && "pl-8")}>
          {children}

          {actions && (
            <div className="mt-3 flex gap-2">
              {actions}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-md p-1 hover:bg-black/5 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
