/**
 * 👥 Page Administration des Utilisateurs - Vérone
 *
 * Interface réservée aux owners pour gérer les utilisateurs
 * et leurs rôles dans le système Vérone.
 */

import React from 'react'
import { redirect } from 'next/navigation'
import { Users, Plus, Shield } from 'lucide-react'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { CreateUserDialog } from '@/components/admin/create-user-dialog'

// Types pour les utilisateurs
export interface UserWithProfile {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  user_metadata?: {
    name?: string
    first_name?: string
    last_name?: string
    job_title?: string
  }
  profile: {
    role: string
    user_type: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    job_title: string | null
    created_at: string
    updated_at: string
  } | null
}

async function getUsersWithProfiles(): Promise<UserWithProfile[]> {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  // Pour récupérer les utilisateurs, nous utilisons une approche simplifiée
  // En récupérant les profils selon la structure DB réelle
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      user_id,
      role,
      user_type,
      first_name,
      last_name,
      phone,
      job_title,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false }) as { data: any[]; error: any }

  if (error) {
    console.error('Erreur lors de la récupération des profils:', error)
    return []
  }

  // ✅ FIX PERFORMANCE: Récupérer TOUS les utilisateurs UNE SEULE FOIS (au lieu de N fois)
  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000 // Limite élevée pour récupérer tous les utilisateurs
  })

  if (usersError) {
    console.error('Erreur Admin API:', usersError)
    return []
  }

  // ✅ FIX PERFORMANCE: Créer Map pour lookup O(1) au lieu de find() O(n)
  const userMap = new Map(users.map(u => [u.id, u]))

  // Construire la liste des utilisateurs avec leurs profils
  const usersWithProfiles: UserWithProfile[] = []

  for (const profile of profiles) {
    // ✅ Lookup O(1) dans la Map au lieu d'appel API
    const user = userMap.get(profile.user_id)

    if (user) {
      usersWithProfiles.push({
        id: user.id,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at || null,
        created_at: user.created_at,
        user_metadata: user.user_metadata || {},
        profile: {
          role: profile.role,
          user_type: profile.user_type,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          job_title: profile.job_title,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      })
    } else {
      console.warn(`User not found for profile user_id: ${profile.user_id}`)
    }
  }

  return usersWithProfiles
}

async function getCurrentUserRole() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single() as { data: any }

  return profile?.role || null
}

export default async function AdminUsersPage() {
  // Vérifier que l'utilisateur est un owner
  const userRole = await getCurrentUserRole()

  if (userRole !== 'owner') {
    redirect('/dashboard') // Rediriger si pas owner
  }

  // Récupérer tous les utilisateurs avec leurs profils
  const users = await getUsersWithProfiles()

  return (
    <div className="space-y-6">
      {/* Header de la page */}
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-neutral-900" />
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Administration des Utilisateurs</h1>
              <p className="text-xs text-neutral-600">
                Gérer les utilisateurs et leurs permissions dans Vérone
              </p>
            </div>
          </div>

          <CreateUserDialog>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm font-medium">
              <Plus className="h-4 w-4" />
              Nouvel Utilisateur
            </button>
          </CreateUserDialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1.5">
            <div className="text-sm font-medium text-neutral-600">Total Utilisateurs</div>
            <Users className="h-3.5 w-3.5 text-neutral-900" />
          </div>
          <div className="px-3 pb-3">
            <div className="text-xl font-bold text-neutral-900">{users.length}</div>
            <p className="text-xs text-neutral-600">Tous rôles confondus</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1.5">
            <div className="text-sm font-medium text-neutral-600">Owners</div>
            <Shield className="h-3.5 w-3.5 text-accent-500" />
          </div>
          <div className="px-3 pb-3">
            <div className="text-xl font-bold text-neutral-900">
              {users.filter(u => u.profile?.role === 'owner').length}
            </div>
            <p className="text-xs text-neutral-600">Administrateurs système</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1.5">
            <div className="text-sm font-medium text-neutral-600">Admins</div>
            <Shield className="h-3.5 w-3.5 text-primary-500" />
          </div>
          <div className="px-3 pb-3">
            <div className="text-xl font-bold text-neutral-900">
              {users.filter(u => u.profile?.role === 'admin').length}
            </div>
            <p className="text-xs text-neutral-600">Gestionnaires</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-3 pb-1.5">
            <div className="text-sm font-medium text-neutral-600">Catalog Managers</div>
            <Shield className="h-3.5 w-3.5 text-success-500" />
          </div>
          <div className="px-3 pb-3">
            <div className="text-xl font-bold text-neutral-900">
              {users.filter(u => u.profile?.role === 'catalog_manager').length}
            </div>
            <p className="text-xs text-neutral-600">Gestionnaires catalogue</p>
          </div>
        </div>
      </div>

      {/* Tableau de gestion des utilisateurs */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Liste des Utilisateurs</h2>
          <UserManagementTable users={users} />
        </div>
      </div>
    </div>
  )
}