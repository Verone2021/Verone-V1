'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Trash2, Loader2 } from 'lucide-react'
import { deleteUnite } from '@/actions/proprietes-unites'
import { toast } from 'sonner'

interface UniteDeleteButtonProps {
  uniteId: string
  uniteName: string
  proprieteId: string
  variant?: 'primaryCopper' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export function UniteDeleteButton({ 
  uniteId, 
  uniteName, 
  proprieteId,
  variant = 'outline',
  size = 'md'
}: UniteDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteUnite(uniteId)
      
      if (result.success) {
        toast.success('Unité supprimée avec succès')
        router.push(`/proprietes/${proprieteId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
        setOpen(false)
      }
    } catch (error) {
      toast.error('Une erreur inattendue est survenue')
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={variant === 'destructive' ? 'text-white' : ''}
      >
        {size === 'icon' ? (
          <Trash2 className="w-4 h-4" />
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'unité <strong>{uniteName}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}