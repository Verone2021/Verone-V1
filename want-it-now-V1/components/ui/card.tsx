"use client"

import { ReactNode, HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const cardVariants = cva(
  'rounded-xl border bg-white text-gray-950 shadow-modern',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        interactive: 'border-gray-200 card-hover cursor-pointer',
        elevated: 'border-gray-200 shadow-modern-lg',
        outlined: 'border-2 border-gray-300 shadow-sm',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight text-spacing', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'



// PropertyCard Component
export interface PropertyCardProps {
  title: string
  location: string
  size: string
  price: number
  status: 'available' | 'occupied' | 'maintenance'
  image?: string
  onClick?: () => void
}

const PropertyCard = forwardRef<HTMLDivElement, PropertyCardProps>(
  ({ title, location, size, price, status, image, onClick }, ref) => {
    const statusConfig = {
      available: { label: 'Disponible', variant: 'warning' as const },
      occupied: { label: 'Occupé', variant: 'success' as const },
      maintenance: { label: 'Maintenance', variant: 'destructive' as const }
    }

    return (
      <Card
        ref={ref}
        variant="interactive"
        padding="none"
        onClick={onClick}
        className="overflow-hidden max-w-sm"
      >
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={statusConfig[status].variant}>
              <div className="w-2 h-2 bg-current rounded-full mr-1.5" />
              {statusConfig[status].label}
            </Badge>
          </div>
          <CardDescription className="mb-4">
            {size} • {location}
          </CardDescription>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-brand-copper">€{price.toLocaleString()}</span>
            <span className="text-sm text-gray-500">/mois</span>
          </div>
        </CardContent>
      </Card>
    )
  }
)
PropertyCard.displayName = 'PropertyCard'


// UserCard Component
export interface UserCardProps {
  name: string
  role: string
  avatar?: string
  email?: string
  stats?: { label: string; value: string | number }[]
  initials?: string
  onClick?: () => void
}

const UserCard = forwardRef<HTMLDivElement, UserCardProps>(
  ({ name, role, avatar, email, stats, initials, onClick }, ref) => {
    const displayInitials = initials || name.split(' ').map(n => n[0]).join('').toUpperCase()

    return (
      <Card ref={ref} variant={onClick ? "interactive" : "default"} onClick={onClick}>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 gradient-green rounded-full flex items-center justify-center shadow-modern">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{displayInitials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              <CardDescription>{role}</CardDescription>
              {email && <CardDescription className="text-xs">{email}</CardDescription>}
            </div>
          </div>
          {stats && (
            <div className="space-y-2 text-sm">
              {stats.map((stat, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-semibold text-brand-copper">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
UserCard.displayName = 'UserCard'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  PropertyCard,
  UserCard,
}