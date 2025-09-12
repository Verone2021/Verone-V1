import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageLayout } from '@/components/layout/page-layout'
import { ProprietairesTable } from '@/components/proprietaires/proprietaires-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/ui/kpi-card'
import { ExportButton } from '@/components/ui/export-button'
import { Users, Building2, FileText, Plus, ArrowLeft, Archive, Key } from 'lucide-react'
import Link from 'next/link'
import { PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { getProprietaires, getProprietairesArchives } from '@/actions/proprietaires'

export default async function ProprietairesPage() {
  // Server-side authentication check
  const supabase = await createClient()
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch proprietaires directly without cache to avoid cookies issue
  let proprietairesList: any[] = []
  let archivedCount = 0
  let brouillonsCount = 0
  
  try {
    // Récupérer SEULEMENT les propriétaires complets (exclure brouillons)
    const result = await getProprietaires({ hideBrouillons: true })
    // Ensure we always have an array
    proprietairesList = Array.isArray(result) ? result : []
    
    // Get archived count
    const archivedResult = await getProprietairesArchives()
    archivedCount = Array.isArray(archivedResult) ? archivedResult.length : 0
    
    // Get brouillons count separately for statistics
    const brouillonsResult = await getProprietaires({ onlyBrouillons: true })
    brouillonsCount = Array.isArray(brouillonsResult) ? brouillonsResult.length : 0
  } catch (error) {
    console.error('Error loading proprietaires:', error)
    proprietairesList = []
    archivedCount = 0
    brouillonsCount = 0
  }
  
  // Additional safety check to ensure proprietairesList is always an array
  if (!Array.isArray(proprietairesList)) {
    console.warn('proprietairesList was not an array, resetting to empty array')
    proprietairesList = []
  }
  
  // Calculate statistics - maintenant seulement pour les propriétaires complets
  const physiquesCount = proprietairesList.filter(p => p.type === 'physique').length
  const moralesCount = proprietairesList.filter(p => p.type === 'morale').length
  // brouillonsCount est déjà calculé séparément ci-dessus lors de la récupération des données
  const completCount = proprietairesList.length // Tous les propriétaires listés sont complets

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Propriétaires"
          description="Gestion des propriétaires physiques et morales"
          actions={
            <div className="flex items-center gap-3">
              <ExportButton 
                exportType="proprietaires"
                title="Exporter"
                variant="outline"
size="md"
              />
              <Link href="/proprietaires/archives">
                <Button variant="outline" className="relative">
                  <Archive className="w-4 h-4 mr-2" />
                  Archives
                  {archivedCount > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {archivedCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/proprietaires/brouillons">
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Brouillons ({brouillonsCount})
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Link href="/proprietaires/new">
                <Button className="gradient-copper text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau propriétaire
                </Button>
              </Link>
            </div>
          }
        />
      }
    >

      {/* KPI Cards Row - Format Vertical */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          className="w-full h-[180px]"
          title="Total propriétaires"
          value={proprietairesList.length}
          variant="copper"
          layout="vertical"
          icon={<Users className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Personnes physiques"
          value={physiquesCount}
          variant="info"
          layout="vertical"
          icon={<Users className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Personnes morales"
          value={moralesCount}
          variant="success"
          layout="vertical"
          icon={<Building2 className="w-6 h-6" />}
        />
        <KPICard
          className="w-full h-[180px]"
          title="Brouillons"
          value={brouillonsCount}
          variant="warning"
          layout="vertical"
          icon={<FileText className="w-6 h-6" />}
        />
      </div>

      {/* Main Table or Empty State */}
      {proprietairesList.length > 0 ? (
        <section className={GridLayouts.tableContainer}>
          <ProprietairesTable
            proprietaires={proprietairesList as any}
          />
        </section>
      ) : (
        <Card className="modern-shadow">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun propriétaire
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Commencez par créer votre premier propriétaire pour gérer vos biens immobiliers.
            </p>
            <Link href="/proprietaires/new">
              <Button className="gradient-copper text-white">
                <Plus className="w-5 h-5 mr-2" />
                Créer le premier propriétaire
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  )
}