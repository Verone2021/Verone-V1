/**
 * 🔑 Modal de Réinitialisation Mot de Passe - Vérone
 *
 * Composant modal sécurisé pour réinitialiser le mot de passe des utilisateurs
 * avec validation et gestion appropriée des erreurs.
 */

'use client';

import React, { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { RoleBadge, type UserRole } from '@verone/ui';
import { cn } from '@verone/utils';
import { Key, Save, X, Eye, EyeOff } from 'lucide-react';

import type { UserWithProfile } from '@/app/admin/users/page';
import { resetUserPassword } from '@verone/admin/actions/user-management';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  onPasswordReset?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onPasswordReset,
}: ResetPasswordDialogProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!user) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation côté client
    if (!newPassword.trim()) {
      setError('Le mot de passe est requis');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setIsResetting(true);
      setError('');

      const result = await resetUserPassword(user.id, newPassword);

      if (!result.success) {
        setError(result.error || 'Erreur lors de la réinitialisation');
        return;
      }

      // Fermer le dialog et réinitialiser les champs
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
      onPasswordReset?.();

      // Notification succès
      console.log('Mot de passe réinitialisé avec succès');
    } catch (error: any) {
      console.error('Erreur réinitialisation mot de passe:', error);
      setError(error.message || "Une erreur inattendue s'est produite");
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting) {
      setError('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      onOpenChange(false);
    }
  };

  const isFormValid =
    newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Réinitialiser le mot de passe</span>
          </DialogTitle>
          <DialogDescription>
            Définir un nouveau mot de passe pour cet utilisateur.
          </DialogDescription>
        </DialogHeader>

        {/* Informations utilisateur */}
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

        <form onSubmit={handleReset} className="space-y-4">
          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-black"
            >
              Nouveau mot de passe *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0 pr-10"
                placeholder="Minimum 8 caractères"
                required
              />
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-black opacity-50" />
                ) : (
                  <Eye className="h-4 w-4 text-black opacity-50" />
                )}
              </ButtonV2>
            </div>
          </div>

          {/* Confirmation mot de passe */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-black"
            >
              Confirmer le mot de passe *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0 pr-10"
                placeholder="Retaper le mot de passe"
                required
              />
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-black opacity-50" />
                ) : (
                  <Eye className="h-4 w-4 text-black opacity-50" />
                )}
              </ButtonV2>
            </div>
          </div>

          {/* Validation temps réel */}
          {newPassword && (
            <div className="text-xs space-y-1">
              <div
                className={`flex items-center space-x-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-black opacity-50'}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span>Au moins 8 caractères</span>
              </div>
              {confirmPassword && (
                <div
                  className={`flex items-center space-x-2 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${newPassword === confirmPassword ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span>Les mots de passe correspondent</span>
                </div>
              )}
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

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <ButtonV2
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isResetting}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="warning"
              icon={Key}
              loading={isResetting}
              disabled={isResetting || !isFormValid}
            >
              Réinitialiser
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
