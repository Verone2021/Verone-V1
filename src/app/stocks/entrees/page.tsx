'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StockEntreesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/stocks/mouvements?tab=in')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirection vers les mouvements d'entrée...</p>
      </div>
    </div>
  )
}
