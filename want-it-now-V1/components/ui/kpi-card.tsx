'use client'

import React from 'react'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number | string
  subtitle?: string
  variant?: 'copper' | 'success' | 'warning' | 'info' | 'default' | 'destructive'
  icon?: React.ReactNode
  className?: string
  layout?: 'horizontal' | 'vertical'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KPICard({ 
  title, 
  value,
  subtitle, 
  variant = 'default', 
  icon, 
  className,
  layout = 'horizontal',
  trend 
}: KPICardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'copper':
        return 'bg-gradient-to-r from-brand-copper/5 to-brand-copper/10 border-brand-copper/20'
      case 'success':
        return 'bg-gradient-to-r from-green-500/5 to-green-600/10 border-green-500/20'
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/5 to-yellow-600/10 border-yellow-500/20'
      case 'info':
        return 'bg-gradient-to-r from-blue-500/5 to-blue-600/10 border-blue-500/20'
      case 'destructive':
        return 'bg-gradient-to-r from-red-500/5 to-red-600/10 border-red-500/20'
      default:
        return 'bg-gradient-to-r from-gray-500/5 to-gray-600/10 border-gray-500/20'
    }
  }

  const getIconClasses = () => {
    switch (variant) {
      case 'copper':
        return 'text-brand-copper'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      case 'destructive':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={cn(
      'modern-shadow transition-all duration-200 hover:shadow-lg border overflow-hidden',
      getVariantClasses(),
      className
    )}>
      <CardContent className={cn(
        layout === 'vertical' ? 'p-3' : 'p-6'
      )}>
        {layout === 'horizontal' ? (
          // Layout horizontal (original)
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {title}
              </p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trend && (
                  <span className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
            </div>
            {icon && (
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-lg bg-white/50',
                getIconClasses()
              )}>
                {icon}
              </div>
            )}
          </div>
        ) : (
          // Layout vertical (optimisé et centré)
          <div className="flex flex-col items-center justify-center h-full">
            {icon && (
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg bg-white/50 mb-1',
                getIconClasses()
              )}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
              </div>
            )}
            <div className="text-center space-y-0.5">
              <p className="text-[11px] font-medium text-gray-600 leading-tight truncate px-1">
                {title}
              </p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {subtitle && (
                <p className="text-[10px] text-gray-500 leading-tight">
                  {subtitle}
                </p>
              )}
              {trend && (
                <span className={cn(
                  "text-[10px] font-medium block",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}