import { PageLayout } from '@/components/layout/page-layout'
import { PageShell, PageHeader } from '@/components/layout/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserX } from 'lucide-react'
import Link from 'next/link'

export default function UserNotFound() {
  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title="Utilisateur non trouvé"
            description="L'utilisateur demandé n'existe pas ou a été supprimé"
            actions={
              <Link href="/admin/utilisateurs">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la liste
                </Button>
              </Link>
            }
          />
        }
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="modern-shadow max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <UserX className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Utilisateur non trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                L'utilisateur que vous cherchez n'existe pas ou n'est plus disponible. 
                Il a peut-être été supprimé ou vous n'avez pas les permissions pour y accéder.
              </p>
              <div className="space-y-3">
                <Link href="/admin/utilisateurs">
                  <Button className="w-full gradient-copper text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la liste des utilisateurs
                  </Button>
                </Link>
                <Link href="/admin/utilisateurs/new">
                  <Button variant="outline" className="w-full">
                    Créer un nouvel utilisateur
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </PageLayout>
  )
}