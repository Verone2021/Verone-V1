import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietesTable } from '@/components/proprietes/proprietes-table'
import { ProprietesFilters } from '@/components/proprietes/proprietes-filters'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/ui/kpi-card'
import { ExportButton } from '@/components/ui/export-button'
import { 
  Building2, 
  Plus, 
  Home, 
  MapPin, 
  Euro, 
  Users,
  BedDouble,
  Key,
  Archive
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { getProprietes, getProprietesStats, getProprietesArchives } from '@/actions/proprietes'
import { formatCurrency } from '@/lib/utils'

interface SearchParams {
  search?: string
  statut?: string
  type?: string
  organisation?: string
}

export default async function ProprietesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  
  // Server-side authentication check using the project pattern
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions using the same pattern as admin pages
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  if (!isSuperAdmin && !isAdmin) {
    // Not an admin, redirect to dashboard
    redirect('/dashboard')
  }

  // Fetch properties with filters
  const filters = {
    search: resolvedSearchParams.search,
    statut: resolvedSearchParams.statut,
    type: resolvedSearchParams.type,
    organisation_id: resolvedSearchParams.organisation
  }

  const [propertiesResult, statsResult, archivesResult] = await Promise.all([
    getProprietes(filters),
    getProprietesStats(),
    getProprietesArchives()
  ])

  const properties = propertiesResult.success ? propertiesResult.data || [] : []
  const stats = statsResult.success ? statsResult.data : {
    total_proprietes: 0,
    proprietes_actives: 0,
    proprietes_brouillon: 0,
    valeur_totale: 0,
    capacite_totale: 0,
    total_unites: 0
  }
  const archivedCount = archivesResult.success ? (archivesResult.data || []).length : 0

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Propriétés"
          description="Gérez votre portefeuille immobilier"
          actions={
            <div className="flex items-center gap-3">
              <ExportButton 
                exportType="proprietes"
                title="Exporter"
                variant="outline"
                size="md"
              />
              {archivedCount > 0 && (
                <Link href="/proprietes/archives">
                  <Button variant="outline" className="relative">
                    <Archive className="w-4 h-4 mr-2" />
                    Archives
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {archivedCount}
                    </span>
                  </Button>
                </Link>
              )}
              <Link href="/proprietes/brouillons">
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Brouillons ({stats?.proprietes_brouillon || 0})
                </Button>
              </Link>
              <Link href="/proprietes/new">
                <Button className="gradient-copper text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle propriété
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      {/* KPI Cards - Format Vertical */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          className="w-full h-[180px]"
          title="Total propriétés"
          value={stats?.total_proprietes || 0}
          variant="copper"
          layout="vertical"
          icon={<Building2 className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Valeur portefeuille"
          value={formatCurrency(stats?.valeur_totale || 0)}
          variant="success"
          layout="vertical"
          icon={<Euro className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Capacité totale"
          value={stats?.capacite_totale || 0}
          variant="info"
          layout="vertical"
          icon={<Users className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Total unités"
          value={stats?.total_unites || 0}
          variant="warning"
          layout="vertical"
          icon={<BedDouble className="w-6 h-6" />}
        />
      </div>

      {/* Filters */}
      <Suspense fallback={<div>Chargement des filtres...</div>}>
        <ProprietesFilters />
      </Suspense>

      {/* Properties Table */}
      <ProprietesTable 
        properties={properties}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
      />
    </PageLayout>
  )
}