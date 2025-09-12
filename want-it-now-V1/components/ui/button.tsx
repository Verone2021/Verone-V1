"use client"

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primaryCopper: [
          'gradient-copper text-white shadow-modern',
          'hover:shadow-modern-lg hover:-translate-y-0.5',
          'focus:ring-brand-copper/30',
          'active:translate-y-0 active:shadow-modern'
        ],
        primaryGreen: [
          'gradient-green text-white shadow-modern',
          'hover:shadow-modern-lg hover:-translate-y-0.5',
          'focus:ring-brand-green/30',
          'active:translate-y-0 active:shadow-modern'
        ],
        secondary: [
          'bg-white text-brand-copper border-2 border-brand-copper shadow-modern',
          'hover:bg-brand-copper hover:text-white hover:shadow-modern-lg hover:-translate-y-0.5',
          'focus:ring-brand-copper/30',
          'active:translate-y-0 active:shadow-modern'
        ],
        ghost: [
          'text-gray-700 bg-transparent',
          'hover:bg-gray-50 hover:text-gray-900',
          'focus:ring-gray-300',
          'active:bg-gray-100'
        ],
        outline: [
          'bg-white text-gray-900 border-2 border-gray-200 shadow-modern',
          'hover:border-gray-300 hover:shadow-modern-lg hover:-translate-y-0.5',
          'focus:ring-gray-300',
          'active:translate-y-0 active:shadow-modern'
        ],
        destructive: [
          'bg-red-500 text-white shadow-modern',
          'hover:bg-red-600 hover:shadow-modern-lg hover:-translate-y-0.5',
          'focus:ring-red-500/30',
          'active:translate-y-0 active:shadow-modern'
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded-lg h-8',
        md: 'px-6 py-3 text-base rounded-xl h-11',
        lg: 'px-8 py-4 text-lg rounded-xl h-14',
        icon: 'w-10 h-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primaryCopper',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }