import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  // Base styles - Design Vérone officiel
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 text-sm font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        // Bouton primaire Vérone : Noir → Blanc au hover
        default: "bg-black text-white border-black hover:bg-white hover:text-black",

        // Bouton secondaire Vérone : Blanc → Noir au hover
        secondary: "bg-white text-black border-black hover:bg-black hover:text-white",

        // Bouton destructeur (système)
        destructive: "bg-white text-red-600 border-red-600 hover:bg-red-600 hover:text-white",

        // Bouton outline
        outline: "bg-transparent text-black border-black hover:bg-black hover:text-white",

        // Bouton ghost (minimal)
        ghost: "border-transparent text-black hover:bg-black hover:text-white hover:border-black",

        // Bouton lien
        link: "border-transparent text-black underline-offset-4 hover:underline hover:opacity-70"
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 py-1 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }