'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { OrganisationForm } from '@/components/organisations/organisation-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NewOrganisationPage() {
  const router = useRouter()
  const { isAuthenticated, isSuperAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
      return
    }

    if (!loading && !isSuperAdmin) {
      router.push('/dashboard')
      return
    }
  }, [loading, isAuthenticated, isSuperAdmin, router])

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-brand-copper" />
        </div>
      </PageLayout>
    )
  }

  if (!isSuperAdmin) {
    return null // Redirect is handled in useEffect
  }

  return (
    <PageLayout className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/organisations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Nouvelle organisation
            </h1>
            <p className="text-gray-600 mt-1">
              Créez une nouvelle organisation sur la plateforme
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="modern-shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Informations de l'organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <OrganisationForm
              onSuccess={() => {
                router.push('/organisations')
              }}
              onCancel={() => {
                router.push('/organisations')
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}