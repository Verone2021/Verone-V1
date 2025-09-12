"use client"

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, value, defaultValue, ...props }, ref) => {
    return (
      <input
        type={type}
        value={value ?? ''}
        className={cn(
          'flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500/30',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }