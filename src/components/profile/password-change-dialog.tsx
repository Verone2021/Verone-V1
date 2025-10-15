/**
 * 🔐 Password Change Dialog - Vérone
 *
 * Composant modal sécurisé pour changement de mot de passe
 * Utilise les bonnes pratiques Supabase Auth
 */

"use client"

import React, { useState } from 'react'
import { Eye, EyeOff, Key, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

export function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Analyse de la force du mot de passe
  const analyzePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?\":{}|<>]/.test(password)
    }

    const score = Object.values(requirements).filter(Boolean).length

    let label = ''
    let color = ''

    switch (score) {
      case 0:
      case 1:
        label = 'Très faible'
        color = 'text-red-600'
        break
      case 2:
        label = 'Faible'
        color = 'text-black'
        break
      case 3:
        label = 'Moyen'
        color = 'text-black'
        break
      case 4:
        label = 'Fort'
        color = 'text-green-500'
        break
      case 5:
        label = 'Très fort'
        color = 'text-green-600'
        break
      default:
        label = 'Inconnu'
        color = 'text-gray-500'
    }

    return { score, label, color, requirements }
  }

  const passwordStrength = analyzePasswordStrength(newPassword)
  const isPasswordValid = passwordStrength.score >= 4
  const isConfirmValid = newPassword === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité')
      return
    }

    if (!isConfirmValid) {
      setError('La confirmation du mot de passe ne correspond pas')
      return
    }

    try {
      setLoading(true)
      setError('')

      const supabase = createClient()

      // Tentative de mise à jour du mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Reset du formulaire après succès
      setTimeout(() => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess(false)
        onOpenChange(false)

        // Notification à l'utilisateur
        alert('Mot de passe mis à jour avec succès ! Vous allez être redirigé vers la page de connexion.')

        // Déconnexion forcée pour sécurité
        supabase.auth.signOut()
        window.location.href = '/login'
      }, 2000)

    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error)
      setError(error.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Changer le mot de passe</span>
          </DialogTitle>
          <DialogDescription>
            Modifiez votre mot de passe pour sécuriser votre compte Vérone
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <div className="text-center">
              <p className="font-medium text-verone-black">Mot de passe mis à jour !</p>
              <p className="text-sm text-verone-black opacity-70">
                Vous allez être redirigé vers la connexion...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-verone-black">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-verone-black focus:ring-verone-black pr-10"
                  placeholder="Votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-verone-black opacity-60 hover:opacity-100"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Indicateur de force */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-verone-black opacity-60">Force du mot de passe</span>
                    <span className={cn("text-xs font-medium", passwordStrength.color)}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 rounded-full",
                          i < passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? "bg-red-500"
                              : passwordStrength.score <= 3
                                ? "bg-black"
                                : "bg-green-500"
                            : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>

                  <div className="text-xs space-y-1">
                    {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                      <div key={key} className={cn("flex items-center space-x-2", met ? "text-green-600" : "text-red-500")}>
                        <div className={cn("w-2 h-2 rounded-full", met ? "bg-green-600" : "bg-red-500")} />
                        <span>
                          {key === 'length' && '8 caractères minimum'}
                          {key === 'uppercase' && 'Une majuscule'}
                          {key === 'lowercase' && 'Une minuscule'}
                          {key === 'number' && 'Un chiffre'}
                          {key === 'special' && 'Un caractère spécial'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-verone-black">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "border-verone-black focus:ring-verone-black pr-10",
                    confirmPassword && !isConfirmValid && "border-red-500 focus:ring-red-500"
                  )}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-verone-black opacity-60 hover:opacity-100"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && !isConfirmValid && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-verone-black text-verone-black hover:bg-verone-black hover:text-verone-white"
              >
                Annuler
              </ButtonV2>
              <Button
                type="submit"
                disabled={loading || !isPasswordValid || !isConfirmValid}
                className="bg-verone-black hover:bg-gray-800 text-verone-white"
              >
                {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
              </ButtonV2>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}