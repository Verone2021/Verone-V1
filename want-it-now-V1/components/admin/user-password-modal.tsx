'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Key, 
  RefreshCw, 
  Copy, 
  Mail, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  setUserPassword, 
  resetUserPassword, 
  sendPasswordResetEmail 
} from '@/actions/auth-admin'

interface User {
  id: string
  email: string
  nom?: string
  prenom?: string
}

interface UserPasswordModalProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserPasswordModal({ user, open, onOpenChange }: UserPasswordModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'temp' | 'email'>('manual')
  const [manualPassword, setManualPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const userName = user.prenom && user.nom 
    ? `${user.prenom} ${user.nom}` 
    : user.email

  // Définir un mot de passe manuellement
  const handleSetManualPassword = async () => {
    if (!manualPassword) {
      toast.error('Veuillez saisir un mot de passe')
      return
    }

    if (manualPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (manualPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)
    try {
      const result = await setUserPassword(user.id, manualPassword)
      
      if (result.success) {
        toast.success('Mot de passe défini avec succès')
        setManualPassword('')
        setConfirmPassword('')
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de la définition du mot de passe')
      }
    } catch (error) {
      console.error('Erreur définition mot de passe:', error)
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  // Générer et assigner un mot de passe temporaire
  const handleGenerateTempPassword = async () => {
    setIsLoading(true)
    try {
      const result = await resetUserPassword(user.id)
      
      if (result.success) {
        setTempPassword(result.data!.tempPassword)
        toast.success('Mot de passe temporaire généré et assigné')
        setActiveTab('temp')
      } else {
        toast.error(result.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      console.error('Erreur génération mot de passe:', error)
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  // Envoyer un email de récupération
  const handleSendResetEmail = async () => {
    setIsLoading(true)
    try {
      const result = await sendPasswordResetEmail(user.email)
      
      if (result.success) {
        toast.success('Email de récupération envoyé avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur envoi email:', error)
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  // Copier le mot de passe temporaire
  const handleCopyTempPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      toast.success('Mot de passe copié dans le presse-papier')
    } catch (error) {
      toast.error('Erreur lors de la copie')
    }
  }

  // Réinitialiser le modal
  const handleClose = () => {
    setActiveTab('manual')
    setManualPassword('')
    setConfirmPassword('')
    setTempPassword('')
    setShowPassword(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Gestion du mot de passe
          </DialogTitle>
          <DialogDescription>
            Gérer le mot de passe pour <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Onglets de sélection */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manuel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('temp')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'temp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Temporaire
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Par email
            </button>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="manual-password"
                    type={showPassword ? 'text' : 'password'}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répéter le mot de passe"
                />
              </div>

              <Button 
                onClick={handleSetManualPassword} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Définition...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Définir le mot de passe
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === 'temp' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Mot de passe temporaire</p>
                    <p className="text-yellow-700 mt-1">
                      Un mot de passe sécurisé sera généré automatiquement et assigné au compte.
                    </p>
                  </div>
                </div>
              </div>

              {tempPassword ? (
                <div className="space-y-3">
                  <Label>Mot de passe généré</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={tempPassword} 
                      readOnly
                      className="font-mono bg-gray-50"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyTempPassword}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Communiquez ce mot de passe à l'utilisateur de manière sécurisée.
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleGenerateTempPassword} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Générer un mot de passe
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Récupération par email</p>
                    <p className="text-blue-700 mt-1">
                      L'utilisateur recevra un lien pour définir son propre mot de passe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email de destination</Label>
                <Input 
                  value={user.email} 
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <Button 
                onClick={handleSendResetEmail} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer le lien de récupération
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}