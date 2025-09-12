import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietesTable } from '@/components/proprietes/proprietes-table'
import { ProprietesFilters } from '@/components/proprietes/proprietes-filters'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/ui/kpi-card'
import { 
  FileEdit, 
  Plus, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-shell'
import { getProprietes, getProprietesStats } from '@/actions/proprietes'

interface SearchParams {
  search?: string
  type?: string
  organisation?: string
}

export default async function ProprieteBrouillonsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  
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

  // Fetch only draft properties
  const filters = {
    search: resolvedSearchParams.search,
    statut: 'brouillon', // Force filter to drafts only
    type: resolvedSearchParams.type,
    organisation_id: resolvedSearchParams.organisation
  }

  const [propertiesResult, statsResult] = await Promise.all([
    getProprietes(filters),
    getProprietesStats()
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

  // Calculate draft-specific stats - using ville field only since adresse is not in ProprieteListItem
  const draftStats = {
    total: properties.length,
    incomplete: properties.filter(p => !p.ville).length,
    withoutPhotos: properties.filter(p => !p.cover_photo_url).length,
    readyToPublish: properties.filter(p => 
      p.ville && 
      p.valeur_actuelle &&
      p.cover_photo_url
    ).length
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Brouillons de propriétés"
          description="Gérez vos propriétés en cours de création"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/proprietes">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Toutes les propriétés
                </Button>
              </Link>
              <Link href="/proprietes/new">
                <Button className="gradient-copper text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau brouillon
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      {/* Draft-specific KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          className="w-full h-[180px]"
          title="Total brouillons"
          value={draftStats.total}
          variant="default"
          layout="vertical"
          icon={<FileEdit className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Incomplets"
          value={draftStats.incomplete}
          variant="warning"
          layout="vertical"
          icon={<AlertCircle className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Sans photos"
          value={draftStats.withoutPhotos}
          variant="info"
          layout="vertical"
          icon={<Clock className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Prêts à publier"
          value={draftStats.readyToPublish}
          variant="success"
          layout="vertical"
          icon={<Sparkles className="w-6 h-6" />}
        />
      </div>

      {/* Draft tips */}
      {properties.length > 0 && draftStats.incomplete > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                {draftStats.incomplete} brouillon{draftStats.incomplete > 1 ? 's' : ''} incomplet{draftStats.incomplete > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Complétez les informations manquantes (adresse, prix, photos) pour pouvoir publier ces propriétés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Suspense fallback={<div>Chargement des filtres...</div>}>
        <ProprietesFilters hiddenFilters={['statut']} />
      </Suspense>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <FileEdit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun brouillon trouvé</h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer un nouveau brouillon de propriété
          </p>
          <Link href="/proprietes/new">
            <Button className="gradient-copper text-white">
              <Plus className="w-4 h-4 mr-2" />
              Créer un brouillon
            </Button>
          </Link>
        </div>
      ) : (
        <ProprietesTable 
          properties={properties}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Quick actions for drafts */}
      {draftStats.readyToPublish > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  {draftStats.readyToPublish} propriété{draftStats.readyToPublish > 1 ? 's' : ''} prête{draftStats.readyToPublish > 1 ? 's' : ''} à publier
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Ces brouillons contiennent toutes les informations nécessaires et peuvent être publiés.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}