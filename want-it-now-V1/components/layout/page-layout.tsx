'use client'

import { ReactNode } from 'react'
import { AppShell } from './app-shell'
import { PageShell } from './page-shell'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  background?: 'gray' | 'white'
  requireAuth?: boolean
  // New PageShell integration props
  usePageShell?: boolean
  header?: ReactNode
  contentClassName?: string
  // Enhanced page props
  title?: string
  description?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
}

export function PageLayout({ 
  children, 
  className = '',
  background = 'gray',
  requireAuth = false,
  usePageShell = false,
  header,
  contentClassName,
  title,
  description,
  breadcrumbs,
  actions
}: PageLayoutProps) {
  // Enhanced page header
  const enhancedHeader = (title || description || breadcrumbs || actions) ? (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {breadcrumbs && (
          <div className="mb-4">
            {breadcrumbs}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-base text-gray-600">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : header

  return (
    <AppShell 
      className={usePageShell ? '' : className}
      background={background}
      requireAuth={requireAuth}
    >
      {usePageShell ? (
        <PageShell 
          header={enhancedHeader}
          className={className}
          contentClassName={contentClassName}
        >
          {children}
        </PageShell>
      ) : (
        <div className="min-h-full">
          {enhancedHeader}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      )}
    </AppShell>
  )
}