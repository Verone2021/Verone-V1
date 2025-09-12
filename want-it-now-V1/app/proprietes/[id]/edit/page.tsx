import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietesEditForm } from '@/components/proprietes/proprietes-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-shell'
import { getProprieteById } from '@/actions/proprietes'

interface EditProprietePageProps {
  params: Promise<{ id: string }>
}

export default async function EditProprietePage({ params }: EditProprietePageProps) {
  const resolvedParams = await params
  
  // Server-side authentication check
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions - only admins can edit properties
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  if (!isSuperAdmin && !isAdmin) {
    redirect('/dashboard')
  }

  // Fetch the property data
  const result = await getProprieteById(resolvedParams.id)
  
  if (!result.success || !result.data) {
    redirect('/proprietes')
  }

  const property = result.data

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Modifier la propriété"
          description={`Modification de ${property.nom}`}
          actions={
            <div className="flex items-center gap-3">
              <Link href={`/proprietes/${resolvedParams.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux détails
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      <div className="max-w-5xl mx-auto">
        <ProprietesEditForm 
          property={property}
          propertyId={resolvedParams.id}
        />
      </div>
    </PageLayout>
  )
}