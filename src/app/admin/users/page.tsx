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
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false }) as { data: any[]; error: any }

  if (error) {
    console.error('Erreur lors de la récupération des profils:', error)
    return []
  }

  // Pour chaque profil, récupérer les données utilisateur via une requête auth
  const usersWithProfiles: UserWithProfile[] = []

  for (const profile of profiles) {
    try {
      // Récupérer les détails de l'utilisateur via l'Admin API
      const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Limite élevée pour récupérer tous les utilisateurs
      })

      if (usersError) {
        console.error('Erreur Admin API:', usersError)
        continue
      }

      // Trouver l'utilisateur correspondant
      const user = users?.find(u => u.id === profile.user_id)

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
            created_at: profile.created_at,
            updated_at: profile.updated_at
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      continue
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
      <div className="border-b border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Administration des Utilisateurs</h1>
              <p className="text-black opacity-70">
                Gérer les utilisateurs et leurs permissions dans Vérone
              </p>
            </div>
          </div>

          <CreateUserDialog>
            <button className="inline-flex items-center justify-center gap-2 font-medium rounded-[10px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.98] bg-black text-white border-none px-6 py-3 h-11 text-[15px] shadow-sm hover:shadow-md">
              <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
              Nouvel Utilisateur
            </button>
          </CreateUserDialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-black">
          <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <div className="text-sm font-medium text-gray-600">Total Utilisateurs</div>
            <Users className="h-4 w-4 text-black" />
          </div>
          <div className="px-4 pb-4">
            <div className="text-2xl font-bold text-black">{users.length}</div>
            <p className="text-xs text-gray-600">Tous rôles confondus</p>
          </div>
        </div>

        <div className="bg-white border border-black">
          <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <div className="text-sm font-medium text-gray-600">Owners</div>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <div className="px-4 pb-4">
            <div className="text-2xl font-bold text-black">
              {users.filter(u => u.profile?.role === 'owner').length}
            </div>
            <p className="text-xs text-gray-600">Administrateurs système</p>
          </div>
        </div>

        <div className="bg-white border border-black">
          <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <div className="text-sm font-medium text-gray-600">Admins</div>
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div className="px-4 pb-4">
            <div className="text-2xl font-bold text-black">
              {users.filter(u => u.profile?.role === 'admin').length}
            </div>
            <p className="text-xs text-gray-600">Gestionnaires</p>
          </div>
        </div>

        <div className="bg-white border border-black">
          <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <div className="text-sm font-medium text-gray-600">Catalog Managers</div>
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <div className="px-4 pb-4">
            <div className="text-2xl font-bold text-black">
              {users.filter(u => u.profile?.role === 'catalog_manager').length}
            </div>
            <p className="text-xs text-gray-600">Gestionnaires catalogue</p>
          </div>
        </div>
      </div>

      {/* Tableau de gestion des utilisateurs */}
      <div className="bg-white border border-black">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Liste des Utilisateurs</h2>
          <UserManagementTable users={users} />
        </div>
      </div>
    </div>
  )
}