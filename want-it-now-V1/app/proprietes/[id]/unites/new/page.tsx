import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { UniteForm } from '@/components/proprietes/unite-form'
import { getProprieteById } from '@/actions/proprietes'

interface NewUnitePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewUnitePage({ params }: NewUnitePageProps) {
  const resolvedParams = await params
  
  // Server-side authentication check
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  if (!isSuperAdmin && !isAdmin) {
    redirect('/dashboard')
  }

  // Fetch the property to ensure it exists
  const propertyResult = await getProprieteById(resolvedParams.id)
  
  if (!propertyResult.success || !propertyResult.data) {
    redirect('/proprietes')
  }

  const property = propertyResult.data

  // Check if property supports units
  if (!property.a_unites) {
    redirect(`/proprietes/${resolvedParams.id}`)
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Nouvelle unité"
          description={`Ajouter une unité à ${property.nom}`}
          actions={
            <Link href={`/proprietes/${resolvedParams.id}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la propriété
              </Button>
            </Link>
          }
        />
      }
    >
      <UniteForm 
        proprieteId={resolvedParams.id}
        proprieteName={property.nom}
        mode="create"
      />
    </PageLayout>
  )
}