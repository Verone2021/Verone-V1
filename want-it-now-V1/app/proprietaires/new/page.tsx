import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { ProprietaireForm } from '@/components/proprietaires/proprietaire-form'

export const metadata: Metadata = {
  title: 'Nouveau Propriétaire | Want It Now',
  description: 'Créer un nouveau propriétaire physique ou morale',
}

export default async function NewProprietairePage() {
  // Server-side authentication check
  const supabase = await createClient()
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Nouveau Propriétaire"
          description="Créer un nouveau propriétaire physique ou morale"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/proprietaires">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la liste
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      <div className="max-w-4xl mx-auto">
        <ProprietaireForm mode="create" />
      </div>
    </PageLayout>
  )
}