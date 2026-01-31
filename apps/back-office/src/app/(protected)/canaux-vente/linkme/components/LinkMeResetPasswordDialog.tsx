/**
 * LinkMeResetPasswordDialog
 * Modal de réinitialisation mot de passe pour utilisateurs LinkMe
 * Copié du pattern admin/reset-password-dialog.tsx
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
import { Key, X, Eye, EyeOff } from 'lucide-react';

import type { LinkMeUser } from '../hooks/use-linkme-users';
import {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
} from '../hooks/use-linkme-users';

interface LinkMeResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: LinkMeUser | null;
  onPasswordReset?: () => void;
}

export function LinkMeResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onPasswordReset,
}: LinkMeResetPasswordDialogProps) {
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

      // Appel API LinkMe
      const response = await fetch('/api/linkme/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Erreur lors de la réinitialisation');
        return;
      }

      // Fermer le dialog et réinitialiser les champs
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
      onPasswordReset?.();

      console.warn('Mot de passe réinitialisé avec succès');
    } catch (error: any) {
      console.error('Erreur réinitialisation mot de passe:', error);
      setError(error.message ?? "Une erreur inattendue s'est produite");
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

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';

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
              <h4 className="font-medium text-black">{fullName}</h4>
              <p className="text-sm text-black opacity-60">{user.email}</p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LINKME_ROLE_COLORS[user.linkme_role]}`}
            >
              {LINKME_ROLE_LABELS[user.linkme_role]}
            </span>
          </div>
        </div>

        <form
          onSubmit={e => {
            void handleReset(e).catch(error => {
              console.error(
                '[LinkMeResetPasswordDialog] handleReset failed:',
                error
              );
            });
          }}
          className="space-y-4"
        >
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
