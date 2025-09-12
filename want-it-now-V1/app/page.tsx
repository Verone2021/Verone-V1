'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building, 
  Key, 
  FileText, 
  Calendar,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { PublicAppShell } from '@/components/layout/app-shell'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  
  // Redirect authenticated users to dashboard (simple, no complex state)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [loading, isAuthenticated, router])

  // Show nothing while checking auth or redirecting
  if (loading || isAuthenticated) {
    return null
  }

  return (
    <PublicAppShell className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Want It Now
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Plateforme complète de gestion locative et sous-location immobilière
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-br from-brand-copper to-secondary-copper text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 px-8 py-3"
              >
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white transition-all duration-200 px-8 py-3"
              >
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="modern-shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 gradient-copper rounded-lg flex items-center justify-center mx-auto mb-2">
                <Building className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">
                Propriétaires
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription>
                Gestion complète de vos propriétaires physiques et moraux
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="modern-shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 gradient-copper rounded-lg flex items-center justify-center mx-auto mb-2">
                <Key className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">
                Propriétés
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription>
                Inventaire détaillé de vos biens avec unités et caractéristiques
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="modern-shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 gradient-copper rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">
                Contrats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription>
                Gestion des baux et contrats de sous-location
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="modern-shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 gradient-copper rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">
                Réservations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <CardDescription>
                Planning et gestion des réservations courte durée
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="modern-shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Pourquoi choisir Want It Now ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Multi-tenant sécurisé</h4>
                  <p className="text-gray-600 text-sm">Isolation complète des données par organisation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Gestion des quotités</h4>
                  <p className="text-gray-600 text-sm">Répartition précise de la propriété entre associés</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Interface moderne</h4>
                  <p className="text-gray-600 text-sm">Design responsive et intuitive</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Évolutif</h4>
                  <p className="text-gray-600 text-sm">Adapté aux petites et grandes structures</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Rejoignez les professionnels qui font confiance à Want It Now pour gérer leur patrimoine immobilier.
          </p>
          <Link href="/register">
            <Button 
              size="lg" 
              className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 px-8 py-3"
            >
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </PublicAppShell>
  )
}