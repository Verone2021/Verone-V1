'use client'

import dynamic from 'next/dynamic'

const ContratWizardMinimalWrapper = dynamic(
  () => import('./contrat-wizard-minimal-wrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4841A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du wizard...</p>
        </div>
      </div>
    )
  }
)

export default function ContratWizardWrapper() {
  return <ContratWizardMinimalWrapper />
}