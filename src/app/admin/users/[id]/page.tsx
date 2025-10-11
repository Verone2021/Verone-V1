/**
 * 👤 Page Détail Utilisateur - Vérone
 *
 * Interface complète pour consulter tous les détails et métriques
 * d'un utilisateur spécifique dans l'administration Vérone.
 */

import React from 'react'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, User, Calendar, Clock, Shield, Activity } from 'lucide-react'
import Link from 'next/link'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { UserHeader } from './components/user-header'
import { UserStatsCards } from './components/user-stats-cards'
import { UserProfileTab } from './components/user-profile-tab'
import { UserActivityTab } from './components/user-activity-tab'
import { UserSecurityTab } from './components/user-security-tab'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

// Extended user interface with analytics data
export interface UserDetailData {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  last_sign_in_at: string | null
  user_metadata?: {
    name?: string
    first_name?: string
    last_name?: string
    job_title?: string
    phone?: string
  }
  profile: {
    role: string
    user_type: string
    created_at: string
    updated_at: string
  } | null
  // Analytics data (calculated)
  analytics: {
    total_sessions: number
    avg_session_duration: number
    last_activity: string | null
    days_since_creation: number
    login_frequency: 'high' | 'medium' | 'low'
    engagement_score: number
  }
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

async function getCurrentUserRole() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  return profile?.role || null
}

async function getUserDetailData(userId: string): Promise<UserDetailData | null> {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  // Récupérer le profil depuis la DB
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single() as { data: any; error: any }

  if (profileError || !profile) {
    console.error('Erreur récupération profil:', profileError)
    return null
  }

  // Récupérer les données utilisateur via Admin API
  try {
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (usersError) {
      console.error('Erreur Admin API:', usersError)
      return null
    }

    const user = users?.find(u => u.id === userId)
    if (!user) return null

    // Calculer days_since_creation
    const createdDate = new Date(user.created_at)
    const daysSinceCreation = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // ✅ Récupérer VRAIES analytics directement depuis Supabase RPC
    let realAnalytics = {
      total_sessions: 0,
      total_actions: 0,
      avg_session_duration: 0,
      most_used_module: null,
      engagement_score: 0,
      last_activity: null
    }

    try {
      // Appel direct RPC Supabase (pas de fetch HTTP)
      const { data: stats, error: statsError } = await (supabase as any).rpc('get_user_activity_stats', {
        p_user_id: userId,
        p_days: 30
      })

      if (!statsError && stats && stats.length > 0) {
        realAnalytics = {
          total_sessions: stats[0].total_sessions || 0,
          total_actions: stats[0].total_actions || 0,
          avg_session_duration: stats[0].avg_session_duration || 0,
          most_used_module: stats[0].most_used_module || null,
          engagement_score: stats[0].engagement_score || 0,
          last_activity: stats[0].last_activity || null
        }
      } else if (statsError) {
        console.warn('Erreur RPC get_user_activity_stats:', statsError)
      }
    } catch (activityError) {
      console.warn('Erreur appel RPC activity:', activityError)
      // Fallback sur données vides si erreur
    }

    // Déterminer login_frequency basé sur engagement_score réel
    const loginFrequency: 'high' | 'medium' | 'low' = 
      realAnalytics.engagement_score > 70 ? 'high' 
      : realAnalytics.engagement_score > 40 ? 'medium' 
      : 'low'

    return {
      id: user.id,
      email: user.email || '',
      email_confirmed_at: user.email_confirmed_at || null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      user_metadata: user.user_metadata || {},
      profile: {
        role: profile.role,
        user_type: profile.user_type,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      analytics: {
        total_sessions: realAnalytics.total_sessions,
        avg_session_duration: realAnalytics.avg_session_duration || 0,
        last_activity: realAnalytics.last_activity || user.last_sign_in_at || null,
        days_since_creation: daysSinceCreation,
        login_frequency: loginFrequency,
        engagement_score: realAnalytics.engagement_score
      }
    }

  } catch (error) {
    console.error('Erreur récupération données utilisateur:', error)
    return null
  }
}

// ✅ Cache Next.js : revalide toutes les 5 minutes
export const revalidate = 300

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Await params pour Next.js 15
  const { id } = await params

  // Vérifier les permissions (owner uniquement)
  const userRole = await getCurrentUserRole()
  if (userRole !== 'owner') {
    redirect('/admin/users')
  }

  // Récupérer les données utilisateur
  const userDetailData = await getUserDetailData(id)
  if (!userDetailData) {
    notFound()
  }

  const formatUserName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.name) {
      return user_metadata.name
    }

    if (user_metadata?.first_name || user_metadata?.last_name) {
      return [user_metadata.first_name, user_metadata.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
    }

    const tempName = email.split('@')[0].split('.') || ['']
    return tempName.length > 1 ? tempName.join(' ') : tempName[0]
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/users">
          <Button
            variant="ghost"
            size="sm"
            className="text-black hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux utilisateurs
          </Button>
        </Link>

        <div className="text-sm text-black opacity-60">
          Administration › Utilisateurs › {formatUserName(userDetailData.email, userDetailData.user_metadata)}
        </div>
      </div>

      {/* Header utilisateur */}
      <UserHeader user={userDetailData} />

      {/* Cartes de statistiques rapides */}
      <UserStatsCards user={userDetailData} />

      {/* Onglets détaillés */}
      <div className="bg-white border border-black">
        <Tabs defaultValue="profile" className="w-full">
          <div className="border-b border-black px-6 py-4">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50">
              <TabsTrigger
                value="profile"
                className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <Activity className="h-4 w-4" />
                <span>Activité</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <Shield className="h-4 w-4" />
                <span>Sécurité</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="profile" className="mt-0">
              <UserProfileTab user={userDetailData} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <UserActivityTab user={userDetailData} />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <UserSecurityTab user={userDetailData} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}