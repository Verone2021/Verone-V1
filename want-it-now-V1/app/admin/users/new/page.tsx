import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserCreateForm } from '@/components/admin/user-create-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  UserPlus,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

async function UserCreateContent() {
  // Vérifier les permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')

  if (!userRoles || userRoles.length === 0) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvel utilisateur</h1>
            <p className="text-gray-600">Créer un nouveau compte utilisateur</p>
          </div>
        </div>
      </div>

      {/* Information importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">Information importante</p>
            <p className="text-blue-700 mt-1">
              La création d'un utilisateur génère automatiquement un compte d'authentification. 
              L'utilisateur recevra un email pour définir son mot de passe.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de création */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Informations utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserCreateForm />
        </CardContent>
      </Card>
    </div>
  )
}

export default function UserCreatePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserCreateContent />
    </Suspense>
  )
}

export const metadata = {
  title: 'Nouvel utilisateur - Administration',
  description: 'Créer un nouveau compte utilisateur',
}