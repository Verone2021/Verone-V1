'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Key, 
  Mail, 
  Eye, 
  EyeOff,
  RefreshCw,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
import { sendPasswordResetEmail, setUserPassword } from '@/actions/auth-admin'

interface UserPasswordManagementProps {
  userId: string
  userEmail: string
}

export function UserPasswordManagement({ userId, userEmail }: UserPasswordManagementProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const handleSendPasswordResetEmail = async () => {
    setIsSendingEmail(true)
    try {
      const result = await sendPasswordResetEmail(userId)
      
      if (result.success) {
        toast.success(`Email de réinitialisation envoyé à ${userEmail}`)
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi de l\'email')
      }
    } catch (error) {
      console.error('Erreur envoi email:', error)
      toast.error('Erreur inattendue lors de l\'envoi de l\'email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const result = await setUserPassword(userId, newPassword)
      
      if (result.success) {
        toast.success('Mot de passe modifié avec succès')
        setNewPassword('')
        setIsPasswordModalOpen(false)
      } else {
        toast.error(result.error || 'Erreur lors de la modification du mot de passe')
      }
    } catch (error) {
      console.error('Erreur modification mot de passe:', error)
      toast.error('Erreur inattendue lors de la modification du mot de passe')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const isPasswordValid = newPassword.length >= 8 && 
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)

  return (
    <>
      <div className="flex gap-3">
        {/* Bouton Envoyer Email Reset */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendPasswordResetEmail}
          disabled={isSendingEmail}
          className="flex items-center gap-2"
        >
          {isSendingEmail ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          Envoyer Email Reset
        </Button>

        {/* Bouton Changer Mot de Passe */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          Changer Mot de Passe
        </Button>
      </div>

      {/* Modal Changement Mot de Passe */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-copper" />
              Modifier le mot de passe
            </DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour <strong>{userEmail}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Saisissez le nouveau mot de passe"
                  className="pr-10 bg-white border-gray-300 focus:border-brand-copper focus:ring-brand-copper/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              
              {/* Indication de validation */}
              <div className="text-xs space-y-1">
                <div className={`flex items-center gap-2 ${
                  newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Au moins 8 caractères
                </div>
                <div className={`flex items-center gap-2 ${
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Une minuscule, une majuscule et un chiffre
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false)
                setNewPassword('')
              }}
              disabled={isUpdatingPassword}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={!isPasswordValid || isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Modifier le mot de passe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}