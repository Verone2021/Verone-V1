/**
 * 🗑️ Modal de Suppression Utilisateur - Vérone
 *
 * Composant modal sécurisé pour confirmer la suppression d'utilisateurs
 * avec vérifications de sécurité appropriées.
 */

"use client"

import React, { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleBadge, type UserRole } from '@/components/ui/role-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteUser } from '@/lib/actions/user-management'
import { UserWithProfile } from '@/app/admin/users/page'
import { cn } from '@/lib/utils'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithProfile | null
  onUserDeleted?: () => void
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onUserDeleted
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>('')

  if (!user) return null

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError('')

      const result = await deleteUser(user.id)

      if (!result.success) {
        setError(result.error || 'Erreur lors de la suppression')
        return
      }

      // Fermer le dialog et notifier le parent
      onOpenChange(false)
      onUserDeleted?.()

      // Notification succès
      // TODO: Ajouter système de notifications toast
      console.log('Utilisateur supprimé avec succès')

    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error)
      setError(error.message || 'Une erreur inattendue s\'est produite')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setError('')
      onOpenChange(false)
    }
  }

  const isOwner = user.profile?.role === 'owner'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Supprimer l'utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et supprimera définitivement cet utilisateur du système.
          </DialogDescription>
        </DialogHeader>

        {/* Informations utilisateur */}
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-black">
                  {user.email.split('@')[0]}
                </h4>
                <p className="text-sm text-black opacity-60">{user.email}</p>
              </div>
              {user.profile?.role && (
                <RoleBadge role={user.profile.role as UserRole} />
              )}
            </div>
          </div>

          {/* Avertissement spécial pour les owners */}
          {isOwner && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Attention !</p>
                  <p className="text-red-700">
                    Vous supprimez un utilisateur avec le rôle Owner.
                    Assurez-vous qu'il existe d'autres Owners dans le système.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="text-sm text-black opacity-70">
            <p>Confirmez-vous la suppression de cet utilisateur ?</p>
            <p className="mt-1 font-medium">
              Cette action supprimera toutes ses données et ne peut pas être annulée.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="border-black text-black hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              "bg-red-600 hover:bg-red-700 text-white",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}