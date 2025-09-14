import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 border",
  {
    variants: {
      variant: {
        default: "bg-black text-white border-black",
        secondary: "bg-white text-black border-black",
        destructive: "bg-red-600 text-white border-red-600",
        outline: "bg-transparent text-black border-black",
        success: "bg-green-600 text-white border-green-600",
        warning: "bg-black text-white border-black",
        info: "bg-blue-600 text-white border-blue-600"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }