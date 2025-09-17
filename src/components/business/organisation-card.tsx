'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Building2,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  Power,
  PowerOff
} from 'lucide-react'
import Link from 'next/link'

interface Organisation {
  id: string
  name: string
  slug: string
  type: 'supplier' | 'customer' | 'partner' | 'internal'
  email: string | null
  country: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  _count?: {
    products: number
  }
}

interface OrganisationCardProps {
  organisation: Organisation
  onEdit?: (organisation: Organisation) => void
  onDelete?: (organisation: Organisation) => void
  onToggleStatus?: (organisation: Organisation) => void
  showActions?: boolean
}

const typeLabels = {
  supplier: 'Fournisseur',
  customer: 'Client',
  partner: 'Partenaire',
  internal: 'Interne'
}

const typeColors = {
  supplier: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
  internal: 'bg-gray-100 text-gray-800'
}

export function OrganisationCard({
  organisation,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true
}: OrganisationCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete?.(organisation)
    setShowDeleteDialog(false)
  }

  const getCatalogueLink = () => {
    switch (organisation.type) {
      case 'supplier':
        return `/catalogue?supplier=${organisation.id}`
      default:
        return '/catalogue'
    }
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg text-black flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {organisation.name}
              </CardTitle>
              <CardDescription className="text-sm">
                ID: {organisation.slug}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={typeColors[organisation.type]}>
                {typeLabels[organisation.type]}
              </Badge>
              <Badge
                variant={organisation.is_active ? 'default' : 'secondary'}
                className={organisation.is_active ? 'bg-green-100 text-green-800' : ''}
              >
                {organisation.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={getCatalogueLink()}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les produits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(organisation)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {onToggleStatus && (
                      <DropdownMenuItem onClick={() => onToggleStatus(organisation)}>
                        {organisation.is_active ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {organisation.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${organisation.email}`}
                  className="hover:text-black"
                >
                  {organisation.email}
                </a>
              </div>
            )}

            {organisation.country && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {organisation.country}
              </div>
            )}
          </div>

          {/* Stats */}
          {organisation.type === 'supplier' && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>Produits liés:</span>
                </div>
                <span className="font-medium text-black">
                  {organisation._count?.products || 0}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Créé le {new Date(organisation.created_at).toLocaleDateString('fr-FR')}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={getCatalogueLink()}>
                  Voir détails
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'organisation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{organisation.name}" ?
              {organisation._count?.products && organisation._count.products > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Attention: Cette organisation est liée à {organisation._count.products} produit(s).
                  La suppression peut affecter ces données.
                </span>
              )}
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}