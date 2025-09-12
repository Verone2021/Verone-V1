import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageShell, PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { UnifiedUserForm } from '@/components/admin/unified-user-form'
import { getOrganisations } from '@/actions/organisations'

export default async function AdminNewUserPage() {
  // Vérification auth côté serveur
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est admin ou super admin
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin')
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin')
  
  if (!isSuperAdmin && !isAdmin) {
    redirect('/dashboard')
  }

  // Charger les organisations disponibles
  const organisationsResult = await getOrganisations()
  const allOrganisations = organisationsResult.ok ? organisationsResult.data || [] : []

  // Filtrer les organisations selon le rôle
  let availableOrganisations = allOrganisations
  if (isAdmin && !isSuperAdmin) {
    const userOrganisationIds = authData.userRoles
      ?.filter(role => role.role === 'admin')
      .map(role => role.organisation_id) || []
    
    availableOrganisations = allOrganisations.filter(org => 
      userOrganisationIds.includes(org.id)
    )
  }

  // Définir les capacités selon le rôle avec le nouveau système
  const capabilities = {
    userRole: isSuperAdmin ? 'super_admin' as const : 'admin' as const,
    canCreateSuperAdmin: isSuperAdmin,
    canCreateAdmin: isSuperAdmin,
    canCreateProprietaire: true, // Les deux peuvent créer des propriétaires
    canCreateLocataire: true, // Les deux peuvent créer des locataires
    canCreateCollaborateur: true, // Les deux peuvent créer des collaborateurs
    canAssignOrganisations: isSuperAdmin,
    availableOrganisations,
    formTitle: isSuperAdmin ? 'Créer un nouvel utilisateur' : 'Créer un utilisateur pour vos organisations',
    formDescription: isSuperAdmin 
      ? 'Créez un utilisateur avec un rôle et des assignations d\'organisations'
      : 'Créez un propriétaire, locataire ou collaborateur pour vos organisations'
  }

  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title="Nouvel Utilisateur"
            description={
              isSuperAdmin 
                ? "Créer un nouvel utilisateur avec rôle et assignations"
                : "Créer un nouvel utilisateur pour vos organisations"
            }
            actions={
              <Link href="/admin/utilisateurs">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la gestion des utilisateurs
                </Button>
              </Link>
            }
          />
        }
      >
        {/* Formulaire de création unifié */}
        <section className={GridLayouts.fullWidth}>
          <UnifiedUserForm capabilities={capabilities} />
        </section>
      </PageShell>
    </PageLayout>
  )
}