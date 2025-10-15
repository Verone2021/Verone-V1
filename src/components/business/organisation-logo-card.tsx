'use client'

/**
 * Composant réutilisable : Card Logo Organisation
 * Wrapper autour de LogoUploadButton avec header unifié
 */

import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LogoUploadButton } from './logo-upload-button'

interface OrganisationLogoCardProps {
  organisationId: string
  organisationName: string
  organisationType: 'supplier' | 'customer' | 'provider'
  currentLogoUrl?: string | null
  onUploadSuccess?: () => void
  className?: string
}

export function OrganisationLogoCard({
  organisationId,
  organisationName,
  organisationType,
  currentLogoUrl,
  onUploadSuccess,
  className
}: OrganisationLogoCardProps) {
  // Labels selon type
  const typeLabels = {
    supplier: 'du fournisseur',
    customer: 'du client',
    provider: 'du prestataire'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Logo de l'organisation
        </CardTitle>
        <CardDescription>
          Gérer le logo {typeLabels[organisationType]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogoUploadButton
          organisationId={organisationId}
          organisationName={organisationName}
          currentLogoUrl={currentLogoUrl}
          onUploadSuccess={onUploadSuccess}
          size="xl"
        />
      </CardContent>
    </Card>
  )
}
