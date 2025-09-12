import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { PageLayout } from '@/components/layout/page-layout'
import { OrganisationsTable } from '@/components/organisations/organisations-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/ui/kpi-card'
import { Building, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { unstable_cache } from 'next/cache'

export default async function OrganisationsPage() {
  // Server-side authentication check using optimized pattern
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check if user is super admin
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  
  if (!isSuperAdmin) {
    // Not a SuperAdmin, redirect to dashboard
    redirect('/dashboard')
  }

  // Create admin client outside of cached function to avoid cookies() issue
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ACCESS_TOKEN!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Cached function to fetch organisations (no cookies inside)
  const getOrganisationsData = unstable_cache(
    async () => {
      const { data: organisations, error: orgsError } = await supabaseAdmin
        .from('organisations')
        .select('id, nom, pays, description, email, telephone, is_active, deleted_at, created_at')
        .order('created_at', { ascending: false })

      if (orgsError) {
        console.error('Error loading organisations:', orgsError)
        return []
      }

      return organisations || []
    },
    ['organisations-list'],
    {
      revalidate: 60, // Cache for 1 minute
      tags: ['organisations']
    }
  )

  const organisationsList = await getOrganisationsData()

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Organisations"
          description="Gérez les organisations de la plateforme"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/profile/super-admin">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au profil
                </Button>
              </Link>
              <Link href="/organisations/new">
                <Button className="gradient-copper text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle organisation
                </Button>
              </Link>
            </div>
          }
        />
      }
    >

      {/* KPI Card - Format Vertical */}
      <div className={GridLayouts.kpiRowVertical}>
        <KPICard
          className={GridLayouts.kpiCardVertical}
          title="Total organisations"
          value={organisationsList.length}
          variant="copper"
          layout="vertical"
          icon={<Building className="w-6 h-6" />}
        />
      </div>

      {/* Main Table or Empty State */}
      {organisationsList.length > 0 ? (
        <section className={GridLayouts.tableContainer}>
          <OrganisationsTable
            organisations={organisationsList as any}
          />
        </section>
      ) : (
        <Card className="modern-shadow">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune organisation
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Commencez par créer votre première organisation pour structurer vos données.
            </p>
            <Link href="/organisations/new">
              <Button className="gradient-copper text-white">
                <Plus className="w-5 h-5 mr-2" />
                Créer la première organisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  )
}