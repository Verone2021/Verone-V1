import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietesWizardSimplified } from '@/components/proprietes/proprietes-wizard-simplified'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-shell'

export default async function NewProprietePage() {
  // Server-side authentication check using the project pattern
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions - only admins can create properties
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  if (!isSuperAdmin && !isAdmin) {
    redirect('/dashboard')
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Nouvelle Propriété"
          description="Créez une nouvelle propriété dans votre portefeuille"
          actions={
            <Link href="/proprietes">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </Button>
            </Link>
          }
        />
      }
    >
      <div className="max-w-5xl mx-auto">
        <ProprietesWizardSimplified />
      </div>
    </PageLayout>
  )
}