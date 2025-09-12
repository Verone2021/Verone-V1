'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, User, Mail, Phone, Building, Shield, Edit } from 'lucide-react'
import Link from 'next/link'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'
import { PageLayout } from '@/components/layout/page-layout'
import { PageShell, PageHeader, GridLayouts } from '@/components/layout/page-shell'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-copper" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <Card className="modern-shadow">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Profil non trouvé</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title="Mon Profil Super Admin"
            description="Gestion de votre profil et accès aux fonctionnalités d'administration"
          />
        }
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="modern-shadow-lg card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 gradient-copper rounded-xl flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">
                        {profile.prenom} {profile.nom || '(Nom non renseigné)'}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/profile/edit">
                    <Button className="gradient-copper text-white">
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Informations personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profile.email}</p>
                      </div>
                    </div>

                    {profile.telephone && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Téléphone</p>
                          <p className="font-medium text-gray-900">{profile.telephone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Rôle et permissions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 gradient-green rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rôle</p>
                        <Badge className={getRoleColor((profile as any).role)}>
                          {getRoleLabel((profile as any).role)}
                        </Badge>
                      </div>
                    </div>

                    {(profile as any).organisation_id && (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Organisation</p>
                          <p className="font-medium text-gray-900">Organisation #{(profile as any).organisation_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-100" />

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Sécurité</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Mot de passe</p>
                        <p className="text-sm text-gray-500">Dernière modification : Jamais</p>
                      </div>
                      <Link href="/profile/change-password">
                        <Button variant="outline" size="sm" className="hover:bg-white">
                          Changer
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloc Administration - déplacé après Sécurité */}
            <Card className="gradient-green modern-shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Administration
                </CardTitle>
                <CardDescription className="text-white/90">
                  En tant que Super Admin, vous avez accès à toutes les fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/utilisateurs" className="block">
                  <Button className="w-full bg-white text-brand-green hover:bg-gray-50 justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Gestion des utilisateurs
                  </Button>
                </Link>
                <Link href="/organisations" className="block">
                  <Button className="w-full bg-white text-brand-green hover:bg-gray-50 justify-start">
                    <Building className="w-4 h-4 mr-2" />
                    Gérer les organisations
                  </Button>
                </Link>
                <Link href="/profile/super-admin/assignations" className="block">
                  <Button className="w-full bg-white text-brand-green hover:bg-gray-50 justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Assignations admin → org
                  </Button>
                </Link>
              </CardContent>
            </Card>
        </div>
      </PageShell>
    </PageLayout>
  )
}