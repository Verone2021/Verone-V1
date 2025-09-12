'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateUtilisateur } from '@/actions/utilisateurs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Save, X } from 'lucide-react'
import Link from 'next/link'

const profileSchema = z.object({
  nom: z.string().max(255).optional(),
  prenom: z.string().max(255).optional(),
  email: z.string().email('Email invalide'),
  telephone: z.string().max(50).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function EditProfilePage() {
  const router = useRouter()
  const { profile, loading: authLoading, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom: profile?.nom || '',
      prenom: profile?.prenom || '',
      email: profile?.email || '',
      telephone: profile?.telephone || '',
    },
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (profile) {
      reset({
        nom: profile.nom || '',
        prenom: profile.prenom || '',
        email: profile.email,
        telephone: profile.telephone || '',
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (!profile?.id) {
        setError('Profil non trouvé')
        setLoading(false)
        return
      }

      // Transform data to match utilisateurs table structure
      const updateData = {
        nom: data.nom || undefined,
        prenom: data.prenom || undefined,
        email: data.email,
        telephone: data.telephone || undefined,
      }

      const result = await updateUtilisateur(profile.id, updateData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/profile')
        }, 1500)
      } else {
        setError(result.error || 'Erreur lors de la mise à jour')
        setLoading(false)
      }
    } catch (error) {
      setError('Erreur inattendue lors de la mise à jour')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4841A]" />
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
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Modifier mon profil</h1>
          <Link href="/profile">
            <Button variant="outline" className="hover:bg-gray-50">
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          </Link>
        </div>

        <Card className="modern-shadow">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="bg-[#D4841A]/10 p-3 rounded-full">
                <User className="h-8 w-8 text-[#D4841A]" />
              </div>
              <div>
                <CardTitle className="text-2xl">Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-[#2D5A27]/10 border-[#2D5A27]/20">
                  <AlertDescription className="text-[#2D5A27]">
                    Profil mis à jour avec succès ! Redirection...
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    {...register('prenom')}
                    className="focus-copper"
                    disabled={loading}
                  />
                  {errors.prenom && (
                    <p className="text-sm text-red-600">{errors.prenom.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    {...register('nom')}
                    className="focus-copper"
                    disabled={loading}
                  />
                  {errors.nom && (
                    <p className="text-sm text-red-600">{errors.nom.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="focus-copper"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  {...register('telephone')}
                  className="focus-copper"
                  placeholder="+33 6 00 00 00 00"
                  disabled={loading}
                />
                {errors.telephone && (
                  <p className="text-sm text-red-600">{errors.telephone.message}</p>
                )}
              </div>

              <div className="pt-6 border-t flex items-center justify-end space-x-3">
                <Link href="/profile">
                  <Button type="button" variant="outline" disabled={loading}>
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="bg-[#D4841A] hover:bg-[#B36F16]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="modern-shadow mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Sécurité</CardTitle>
            <CardDescription>
              Gérez vos paramètres de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Mot de passe</p>
                <p className="text-sm text-gray-500">
                  Dernière modification : Jamais
                </p>
              </div>
              <Link href="/profile/change-password">
                <Button variant="outline">
                  Modifier
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Authentification à deux facteurs</p>
                <p className="text-sm text-gray-500">
                  Non activée
                </p>
              </div>
              <Button variant="outline" disabled>
                Configurer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}