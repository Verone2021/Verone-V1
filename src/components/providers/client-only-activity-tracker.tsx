/**
 * 📊 Client-Only Activity Tracker - Vérone
 * Wrapper SSR-safe pour ActivityTrackerProvider
 * Évite crash Next.js 15 lors du SSR (Server-Side Rendering)
 * ✅ Pattern recommandé Next.js 15 pour client components utilisant browser APIs
 */

'use client'

import { useEffect, useState } from 'react'
import { ActivityTrackerProvider } from './activity-tracker-provider'

interface ClientOnlyActivityTrackerProps {
  children: React.ReactNode
}

export function ClientOnlyActivityTracker({ children }: ClientOnlyActivityTrackerProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Pendant SSR ou avant hydration, render children sans tracker
  if (!hasMounted) {
    return <>{children}</>
  }

  // Après hydration, activer ActivityTrackerProvider
  return (
    <ActivityTrackerProvider>
      {children}
    </ActivityTrackerProvider>
  )
}
