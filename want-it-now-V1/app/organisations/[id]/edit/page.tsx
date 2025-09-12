'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { OrganisationForm } from '@/components/organisations/organisation-form'
import { getOrganisations } from '@/actions/organisations'
import { type Organisation } from '@/lib/validations/organisations'
import { type ActionResult } from '@/actions/organisations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Building, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditOrganisationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const { isAuthenticated, canAccessAdmin, loading: authLoading } = useAuth()
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }

    if (!authLoading && !canAccessAdmin) {
      router.push('/dashboard')
      return
    }
  }, [authLoading, isAuthenticated, canAccessAdmin, router])

  useEffect(() => {
    async function fetchOrganisation() {
      if (!isAuthenticated || !canAccessAdmin || !id) return
      
      try {
        setLoading(true)
        const result: ActionResult<Organisation[]> = await getOrganisations()
        
        if (result.ok && result.data) {
          const foundOrg = result.data.find((org: Organisation) => org.id === id)
          if (foundOrg) {
            setOrganisation(foundOrg)
          } else {
            setError('Organisation non trouvée')
          }
        } else {
          setError(result.error || 'Erreur lors du chargement de l\'organisation')
        }
      } catch (err) {
        setError('Erreur inattendue lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganisation()
  }, [isAuthenticated, canAccessAdmin, id])

  const handleSuccess = (updatedOrganisation?: Organisation) => {
    router.push(`/organisations/${id}`)
  }

  const handleCancel = () => {
    router.push(`/organisations/${id}`)
  }

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-copper mx-auto mb-4" />
            <p className="text-gray-600">Chargement de l'organisation...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !organisation) {
    return (
      <PageLayout className="container mx-auto py-10">
        <Card className="max-w-md mx-auto border-red-200">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Building className="w-12 h-12 mx-auto" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Organisation non trouvée'}
            </h1>
            <p className="text-gray-600 mb-4">
              Impossible de charger l'organisation à modifier.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/organisations">
                <Button variant="outline">
                  Retour aux organisations
                </Button>
              </Link>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white"
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/organisations/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier l'organisation
          </h1>
          <p className="text-gray-600 mt-1">
            {organisation.nom}
          </p>
        </div>
      </div>

      {/* Organisation Form */}
      <div className="max-w-4xl">
        <OrganisationForm
          organisation={organisation}
          mode="edit"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </PageLayout>
  )
}