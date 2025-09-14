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
import { Button } from '@/components/ui/button'
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
    .order('created_at', { ascending: false })

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
          email_confirmed_at: user.email_confirmed_at,
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
    .single()

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
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </CreateUserDialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-black p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-black opacity-60" />
            <div>
              <p className="text-sm text-black opacity-60">Total Utilisateurs</p>
              <p className="text-lg font-semibold text-black">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-black opacity-60" />
            <div>
              <p className="text-sm text-black opacity-60">Owners</p>
              <p className="text-lg font-semibold text-black">
                {users.filter(u => u.profile?.role === 'owner').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-black opacity-60" />
            <div>
              <p className="text-sm text-black opacity-60">Admins</p>
              <p className="text-lg font-semibold text-black">
                {users.filter(u => u.profile?.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-black opacity-60" />
            <div>
              <p className="text-sm text-black opacity-60">Catalog Managers</p>
              <p className="text-lg font-semibold text-black">
                {users.filter(u => u.profile?.role === 'catalog_manager').length}
              </p>
            </div>
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