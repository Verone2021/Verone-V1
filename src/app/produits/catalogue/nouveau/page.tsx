"use client"

import { useState, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, CheckCircle, Circle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Lazy loading du wizard produit complet
const CompleteProductWizard = lazy(() => import('@/components/business/complete-product-wizard').then(module => ({ default: module.CompleteProductWizard })))

export default function NouveauProduitPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = (productId: string) => {
    // Rediriger vers la page produit créé
    router.push(`/catalogue/${productId}`)
  }

  const handleBack = () => {
    if (showForm) {
      setShowForm(false)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {showForm ? 'Retour à la présentation' : 'Retour au catalogue'}
            </Button>

            {/* Indicateur d'étape */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                {showForm ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 mr-1" />
                )}
                Présentation
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center">
                {showForm ? (
                  <Circle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 mr-1" />
                )}
                Création
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!showForm ? (
          // ÉTAPE 1 - Présentation du Nouveau Produit Complet
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">
                Nouveau Produit Complet
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Création détaillée avec toutes les informations produit.
                Prenez le temps de renseigner tous les détails de votre produit.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Carte explicative Produit Complet */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200"
                onClick={() => setShowForm(true)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Nouveau Produit Complet</CardTitle>
                  <CardDescription className="text-base">
                    Création détaillée avec toutes les informations produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      ✨ Champs disponibles :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Informations générales</li>
                      <li>• Catégorisation et famille</li>
                      <li>• Fournisseur et sourcing</li>
                      <li>• Tarification et coûts</li>
                      <li>• Caractéristiques techniques</li>
                      <li>• Images et médias</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      🔄 Avantages :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Aucun champ obligatoire</strong></li>
                      <li>• Sauvegarde progressive</li>
                      <li>• Finalisation quand vous voulez</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Temps estimé : 5-15 minutes
                    </Badge>
                  </div>

                  <div className="pt-4 text-center">
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm hover:shadow-md transition-all px-6 py-2 text-sm"
                      onClick={() => setShowForm(true)}
                    >
                      Commencer la création complète
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // ÉTAPE 2 - Wizard Produit Complet
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3"></div>
              <span className="text-gray-600">Chargement du formulaire complet...</span>
            </div>
          }>
            <CompleteProductWizard
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
