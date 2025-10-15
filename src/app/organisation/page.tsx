'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Page Organisation - Redirection vers Contacts & Organisations
 *
 * Cette page redirige automatiquement vers /contacts-organisations
 * pour éviter la duplication de code et centraliser la gestion
 * de l'écosystème relationnel Vérone.
 */
export default function OrganisationPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/contacts-organisations')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirection...</p>
      </div>
    </div>
  )
}
