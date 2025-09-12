'use client'

import { ReactNode } from 'react'
import { PageShell, PageHeader, GridLayouts } from './page-shell'
import { PageLayout } from './page-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UserManagementShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  backHref?: string
  backLabel?: string
}

export function UserManagementShell({
  title,
  description,
  actions,
  children,
  backHref,
  backLabel = "Retour"
}: UserManagementShellProps) {
  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title={title}
            description={description}
            actions={
              <div className="flex items-center gap-3">
                {backHref && (
                  <Link href={backHref}>
                    <Button variant="ghost">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {backLabel}
                    </Button>
                  </Link>
                )}
                {actions}
              </div>
            }
          />
        }
      >
        {children}
      </PageShell>
    </PageLayout>
  )
}

// Utility wrapper for consistent form layouts
export function UserFormSection({ 
  children, 
  fullWidth = false 
}: { 
  children: ReactNode
  fullWidth?: boolean 
}) {
  return (
    <section className={fullWidth ? GridLayouts.fullWidth : GridLayouts.contentMain}>
      {children}
    </section>
  )
}

// Utility wrapper for consistent stats display
export function UserStatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className={GridLayouts.kpiRow}>
      {children}
    </div>
  )
}