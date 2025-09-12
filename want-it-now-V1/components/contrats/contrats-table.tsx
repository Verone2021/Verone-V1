'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContratAvecRelations, ContratStatus } from '@/types/contrats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteContrat } from '@/actions/contrats'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ContratsTableProps {
  contrats: ContratAvecRelations[]
}

export function ContratsTable({ contrats }: ContratsTableProps) {
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (contratId: string) => {
    setLoadingDelete(contratId)
    
    try {
      const result = await deleteContrat(contratId)
      
      if (result.success) {
        toast.success('Contrat supprimé avec succès')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur inattendue lors de la suppression')
    } finally {
      setLoadingDelete(null)
    }
  }

  const getStatusBadge = (contrat: ContratAvecRelations) => {
    const now = new Date()
    const dateDebut = new Date(contrat.date_debut)
    const dateFin = new Date(contrat.date_fin)
    
    let status: ContratStatus
    let variant: "default" | "secondary" | "destructive" | "outline"
    let emoji = ""
    
    if (now < dateDebut) {
      status = 'a_venir'
      variant = 'outline'
      emoji = '⏳'
    } else if (now >= dateDebut && now <= dateFin) {
      status = 'en_cours'
      variant = 'default'
      emoji = '🔄'
    } else {
      status = 'termine'
      variant = 'secondary'
      emoji = '✅'
    }

    const labels = {
      'a_venir': 'À venir',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    }

    return (
      <Badge variant={variant} className="text-xs">
        {emoji} {labels[status]}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (contrats.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contrat</h3>
        <p className="text-gray-500 mb-4">
          Vous n'avez pas encore créé de contrat.
        </p>
        <Link href="/contrats/new">
          <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
            Créer votre premier contrat
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Propriété/Unité</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Meublé</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contrats.map((contrat) => (
            <TableRow key={contrat.id}>
              <TableCell>
                <div className="font-medium capitalize">
                  {contrat.type_contrat}
                </div>
                <div className="text-sm text-gray-500">
                  Émis le {new Date(contrat.date_emission).toLocaleDateString('fr-FR')}
                </div>
              </TableCell>
              
              <TableCell>
                {contrat.propriete_nom && (
                  <div>
                    <div className="font-medium">{contrat.propriete_nom}</div>
                    <div className="text-sm text-gray-500">
                      {contrat.propriete_adresse}, {contrat.propriete_ville}
                    </div>
                  </div>
                )}
                {contrat.unite_nom && (
                  <div>
                    <div className="font-medium">
                      Unité {contrat.unite_numero} - {contrat.unite_nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contrat.unite_propriete_nom}
                    </div>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <div>Du {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}</div>
                  <div>Au {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}</div>
                </div>
                {contrat.duree_jours && (
                  <div className="text-xs text-gray-500 mt-1">
                    {contrat.duree_jours} jours
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {getStatusBadge(contrat)}
              </TableCell>
              
              <TableCell>
                <Badge variant={contrat.meuble ? 'default' : 'outline'}>
                  {contrat.meuble ? '🏠 Meublé' : '📦 Vide'}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="font-medium">
                  {contrat.commission_pourcentage}%
                </div>
                {contrat.autorisation_sous_location && (
                  <Badge variant="outline" className="text-xs mt-1">
                    ✅ Sous-location
                  </Badge>
                )}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/contrats/${contrat.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Link href={`/contrats/${contrat.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le contrat</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce contrat {contrat.type_contrat} ?
                          Cette action est définitive et ne peut pas être annulée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(contrat.id)}
                          disabled={loadingDelete === contrat.id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {loadingDelete === contrat.id ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}