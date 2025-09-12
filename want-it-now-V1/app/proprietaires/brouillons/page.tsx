import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietairesBrouillonsTable } from '@/components/proprietaires/proprietaires-brouillons-table'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/ui/kpi-card'
import { 
  FileEdit, 
  Plus, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-shell'
import { getProprietaires } from '@/actions/proprietaires'

interface SearchParams {
  search?: string
  type?: string
}

export default async function ProprietairesBrouillonsPage({
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

  // Fetch only draft proprietaires - filtrer par is_brouillon = true
  const filters = {
    search: resolvedSearchParams.search,
    typeFilter: resolvedSearchParams.type || 'all',
    hideBrouillons: false, // Montrer seulement les brouillons
    hideInactive: true,    // Cacher les inactifs
    onlyBrouillons: true   // Nouveau filtre pour ne récupérer QUE les brouillons
  }

  const proprietaires = await getProprietaires(filters)
  
  // Filtrer côté client si nécessaire (fallback)
  const brouillonProprietaires = proprietaires.filter(p => p.is_brouillon === true)

  // Calculate draft-specific stats
  const draftStats = {
    total: brouillonProprietaires.length,
    incomplete: brouillonProprietaires.filter(p => 
      !p.email || !p.telephone || !p.adresse
    ).length,
    withoutBanking: brouillonProprietaires.filter(p => !p.iban).length,
    readyToPublish: brouillonProprietaires.filter(p => 
      p.email && 
      p.telephone && 
      p.adresse &&
      p.iban
    ).length
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Brouillons de propriétaires"
          description="Gérez vos propriétaires en cours de création"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/proprietaires">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tous les propriétaires
                </Button>
              </Link>
              <Link href="/proprietaires/new">
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
          title="Infos manquantes"
          value={draftStats.incomplete}
          variant="warning"
          layout="vertical"
          icon={<AlertCircle className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Sans infos bancaires"
          value={draftStats.withoutBanking}
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
      {brouillonProprietaires.length > 0 && draftStats.incomplete > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                {draftStats.incomplete} brouillon{draftStats.incomplete > 1 ? 's' : ''} incomplet{draftStats.incomplete > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Complétez les informations manquantes (contact, adresse, infos bancaires) pour pouvoir publier ces propriétaires.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proprietaires Table */}
      {brouillonProprietaires.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <FileEdit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun brouillon trouvé</h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer un nouveau brouillon de propriétaire
          </p>
          <Link href="/proprietaires/new">
            <Button className="gradient-copper text-white">
              <Plus className="w-4 h-4 mr-2" />
              Créer un brouillon
            </Button>
          </Link>
        </div>
      ) : (
        <ProprietairesBrouillonsTable proprietaires={brouillonProprietaires} />
      )}

      {/* Quick actions for drafts */}
      {draftStats.readyToPublish > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">
                  {draftStats.readyToPublish} propriétaire{draftStats.readyToPublish > 1 ? 's' : ''} prêt{draftStats.readyToPublish > 1 ? 's' : ''} à publier
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