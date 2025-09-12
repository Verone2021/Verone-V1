import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { UniteForm } from '@/components/proprietes/unite-form'
import { getProprieteById } from '@/actions/proprietes'
import { getUniteById } from '@/actions/proprietes-unites'

interface EditUnitePageProps {
  params: Promise<{
    id: string
    uniteId: string
  }>
}

export default async function EditUnitePage({ params }: EditUnitePageProps) {
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

  // Fetch the property and unit to ensure they exist
  const [propertyResult, uniteResult] = await Promise.all([
    getProprieteById(resolvedParams.id),
    getUniteById(resolvedParams.uniteId)
  ])
  
  if (!propertyResult.success || !propertyResult.data) {
    redirect('/proprietes')
  }

  if (!uniteResult.success || !uniteResult.data) {
    redirect(`/proprietes/${resolvedParams.id}`)
  }

  const property = propertyResult.data
  const unite = uniteResult.data

  // Check if property supports units
  if (!property.a_unites) {
    redirect(`/proprietes/${resolvedParams.id}`)
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title={`Modifier ${unite.nom}`}
          description={`Modification de l'unité ${unite.numero || ''} - ${property.nom}`}
          actions={
            <Link href={`/proprietes/${resolvedParams.id}/unites/${resolvedParams.uniteId}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'unité
              </Button>
            </Link>
          }
        />
      }
    >
      <UniteForm 
        proprieteId={resolvedParams.id}
        proprieteName={property.nom}
        uniteId={resolvedParams.uniteId}
        mode="edit"
      />
    </PageLayout>
  )
}