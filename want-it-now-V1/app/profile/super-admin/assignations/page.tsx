import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageShell, PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/ui/kpi-card'
import { ArrowLeft, Shield, Building, User, Link as LinkIcon, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { getOrganisations } from '@/actions/organisations'
import { listUsersWithRoles } from '@/actions/utilisateurs'
import { AssignmentTable } from '@/components/super-admin/assignment-table'

export default async function SuperAdminAssignationsPage() {
  // Vérification auth côté serveur
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin')
  
  if (!isSuperAdmin) {
    redirect('/dashboard')
  }

  // Charger les données nécessaires
  const [organisationsResult, usersResult] = await Promise.all([
    getOrganisations(),
    listUsersWithRoles()
  ])

  const organisations = organisationsResult.ok ? organisationsResult.data || [] : []
  const allUsers = usersResult.success ? usersResult.data || [] : []
  
  // Filtrer les admins uniquement
  const admins = allUsers.filter(user => 
    user.user_roles?.some(role => role.role === 'admin')
  )

  // Calculer les statistiques
  const stats = {
    totalOrganisations: organisations.length,
    activeOrganisations: organisations.filter(org => org.is_active).length,
    totalAdmins: admins.length,
    assignedAdmins: admins.filter(admin => 
      admin.user_roles?.some(role => role.organisation_id)
    ).length,
    unassignedOrganisations: organisations.filter(org => 
      !admins.some(admin => 
        admin.user_roles?.some(role => 
          role.role === 'admin' && role.organisation_id === org.id
        )
      )
    ).length
  }

  // Préparer les données pour la table d'assignations
  const assignmentData = organisations.map(org => {
    const orgAdmins = admins.filter(admin =>
      admin.user_roles?.some(role => 
        role.role === 'admin' && role.organisation_id === org.id
      )
    )
    
    return {
      organisation: org,
      admins: orgAdmins,
      hasAdmin: orgAdmins.length > 0
    }
  })

  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title="Assignations Admin → Organisation"
            description="Gérez les assignations des administrateurs aux organisations"
            actions={
              <div className="flex items-center gap-3">
                <Link href="/profile/super-admin">
                  <Button variant="ghost">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au profil
                  </Button>
                </Link>
                <Link href="/admin/utilisateurs/new">
                  <Button className="gradient-copper text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un admin
                  </Button>
                </Link>
              </div>
            }
          />
        }
      >
        {/* Statistiques - Format Vertical */}
        <div className={GridLayouts.kpiRowVertical}>
          <KPICard
            className={GridLayouts.kpiCardVertical}
            title="Organisations"
            value={stats.totalOrganisations}
            variant="copper"
            layout="vertical"
            icon={<Building className="w-6 h-6" />}
          />
          
          <KPICard
            className={GridLayouts.kpiCardVertical}
            title="Administrateurs"
            value={stats.totalAdmins}
            variant="info"
            layout="vertical"
            icon={<Settings className="w-6 h-6" />}
          />
          
          <KPICard
            className={GridLayouts.kpiCardVertical}
            title="Assignations"
            value={`${stats.assignedAdmins}/${stats.totalOrganisations}`}
            variant="success"
            layout="vertical"
            icon={<LinkIcon className="w-6 h-6" />}
          />
          
          <KPICard
            className={GridLayouts.kpiCardVertical}
            title="Sans admin"
            value={stats.unassignedOrganisations}
            variant={stats.unassignedOrganisations > 0 ? "warning" : "success"}
            layout="vertical"
            icon={<Shield className="w-6 h-6" />}
          />
        </div>

        {/* Table des assignations */}
        <section className={GridLayouts.tableContainer}>
          <Card className="modern-shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Gestion des Assignations</CardTitle>
              <CardDescription>
                Assignez des administrateurs aux organisations pour leur permettre de gérer les utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentTable 
                data={assignmentData}
                availableAdmins={admins}
              />
            </CardContent>
          </Card>
        </section>
      </PageShell>
    </PageLayout>
  )
}