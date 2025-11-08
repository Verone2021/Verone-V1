/**
 * ✏️ Modal d'Édition Utilisateur - Vérone
 *
 * Composant modal pour modifier les informations d'un utilisateur
 * avec validation et gestion des rôles appropriés.
 */

'use client';

import React, { useState } from 'react';

import { Edit, Save, X, User } from 'lucide-react';

import type { UserWithProfile } from '@/app/admin/users/page';
import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserProfile } from '@/lib/actions/user-management';
import { cn } from '@verone/utils';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  onUserUpdated?: () => void;
}

interface EditFormData {
  first_name: string;
  last_name: string;
  job_title: string;
  role: string;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: EditUserDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialiser avec les données utilisateur ou valeurs par défaut
  const [formData, setFormData] = useState<EditFormData>({
    first_name: '', // Sera extrait de l'email temporairement
    last_name: '',
    job_title: '',
    role: user?.profile?.role || 'catalog_manager',
  });

  // Réinitialiser le formulaire quand l'utilisateur change
  React.useEffect(() => {
    if (user) {
      // Extraire nom temporaire depuis l'email (en attendant les colonnes DB)
      const tempName = user.email.split('@')[0].split('.') || ['', ''];
      setFormData({
        first_name: user.profile?.first_name || tempName[0] || '',
        last_name: user.profile?.last_name || tempName[1] || '',
        job_title: user.profile?.job_title || '',
        role: user.profile?.role || 'catalog_manager',
      });
    }
  }, [user]);

  if (!user) return null;

  const handleInputChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim()) {
      setError('Le prénom est requis');
      return;
    }

    try {
      setIsUpdating(true);
      setError('');

      const result = await updateUserProfile(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        job_title: formData.job_title.trim(),
        role: formData.role,
      });

      if (!result.success) {
        setError(result.error || 'Erreur lors de la mise à jour');
        return;
      }

      // Fermer le dialog et notifier le parent
      onOpenChange(false);
      onUserUpdated?.();

      // Notification succès
      console.log('Utilisateur mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur mise à jour utilisateur:', error);
      setError(error.message || "Une erreur inattendue s'est produite");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Modifier l'utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de profil de l'utilisateur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (non modifiable) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-black">
              Adresse e-mail
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-gray-50 border-black text-black opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-black opacity-50">
              L'adresse e-mail ne peut pas être modifiée
            </p>
          </div>

          {/* Prénom */}
          <div className="space-y-2">
            <Label
              htmlFor="first_name"
              className="text-sm font-medium text-black"
            >
              Prénom *
            </Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={e => handleInputChange('first_name', e.target.value)}
              className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0"
              placeholder="Prénom de l'utilisateur"
              required
            />
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label
              htmlFor="last_name"
              className="text-sm font-medium text-black"
            >
              Nom
            </Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={e => handleInputChange('last_name', e.target.value)}
              className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0"
              placeholder="Nom de famille"
            />
          </div>

          {/* Poste */}
          <div className="space-y-2">
            <Label
              htmlFor="job_title"
              className="text-sm font-medium text-black"
            >
              Poste
            </Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={e => handleInputChange('job_title', e.target.value)}
              className="bg-white border-black text-black placeholder:text-black placeholder:opacity-50 focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0"
              placeholder="Fonction dans l'entreprise"
            />
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-black">
              Rôle système
            </Label>
            <Select
              value={formData.role}
              onValueChange={value => handleInputChange('role', value)}
            >
              <SelectTrigger className="bg-white border-black text-black focus:ring-black focus:border-black focus:ring-2 focus:ring-offset-0">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent className="bg-white border-black">
                <SelectItem
                  value="catalog_manager"
                  className="text-black focus:bg-gray-100 focus:text-black"
                >
                  Catalog Manager
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-black focus:bg-gray-100 focus:text-black"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="owner"
                  className="text-black focus:bg-gray-100 focus:text-black"
                >
                  Owner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              disabled={isUpdating}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="success"
              icon={Save}
              loading={isUpdating}
              disabled={isUpdating || !formData.first_name.trim()}
            >
              Enregistrer
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
