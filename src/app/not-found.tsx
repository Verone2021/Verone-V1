"use client"

/**
 * 🚫 Page 404 Personnalisée - Vérone Back Office
 *
 * Page d'erreur 404 avec design Vérone et navigation intelligente
 * Client Component pour utiliser les event handlers onClick
 */

import Link from 'next/link'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 border border-gray-200 text-center">
        {/* Icône d'erreur Vérone */}
        <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-black" />
        </div>

        {/* Titre Vérone */}
        <h1 className="text-3xl font-bold text-black mb-2">
          404
        </h1>

        <h2 className="text-xl font-semibold text-black mb-4">
          Page introuvable
        </h2>

        {/* Message explicatif */}
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions utilisateur */}
        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-black hover:bg-gray-800 text-white">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full border-black text-black hover:bg-gray-50"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back()
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Page précédente
          </Button>
        </div>

        {/* Footer Vérone */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Vérone Back Office • Erreur 404
          </p>
        </div>
      </div>
    </div>
  )
}