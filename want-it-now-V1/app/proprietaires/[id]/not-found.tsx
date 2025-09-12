import Link from 'next/link'
import { AlertCircle, ArrowLeft, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProprietaireNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Propriétaire non trouvé
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-500">
            Le propriétaire que vous recherchez n'existe pas ou vous n'avez pas les permissions pour y accéder.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/proprietaires">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
            
            <Button asChild>
              <Link href="/proprietaires/new">
                <Users className="h-4 w-4 mr-2" />
                Créer un propriétaire
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}