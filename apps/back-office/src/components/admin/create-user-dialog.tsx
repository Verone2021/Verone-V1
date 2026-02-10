/**
 * 👤 Modal de Création d'Utilisateur - Vérone
 *
 * Interface pour que les owners puissent créer de nouveaux
 * utilisateurs avec assignation de rôles.
 */

'use client';

import type { ReactNode } from 'react';
import React, { useState } from 'react';

import { createUserWithRole } from '@/app/actions/user-management';
import { useToggle } from '@verone/hooks';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { RoleBadge, type UserRole } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { User, Mail, Phone, Briefcase, Eye, EyeOff } from 'lucide-react';

// import { validateProfileForm } from '@verone/utils/validation/profile-validation'

interface CreateUserDialogProps {
  children: ReactNode;
}

interface CreateUserFormData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
}

const INITIAL_FORM_DATA: CreateUserFormData = {
  email: '',
  password: '',
  role: 'admin',
  firstName: '',
  lastName: '',
  phone: '',
  jobTitle: '',
};

export function CreateUserDialog({ children }: CreateUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, toggleShowPassword, setShowPassword] = useToggle(false);
  const [formData, setFormData] =
    useState<CreateUserFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: keyof CreateUserFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Nettoyer l'erreur lors de la saisie
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation email
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password =
        'Le mot de passe doit contenir au moins 8 caractères';
    }

    // Validation rôle
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrors({}); // Nettoyer les erreurs précédentes

      const result = await createUserWithRole(formData);

      // Validation stricte de la réponse du Server Action
      if (!result || typeof result !== 'object') {
        throw new Error('Réponse invalide du serveur - format inattendu');
      }

      if (result.success) {
        // Réinitialiser le formulaire
        setFormData(INITIAL_FORM_DATA);
        setErrors({});
        setIsOpen(false);

        // Utiliser router.refresh() pour recharger les données sans reload complet
        // Note: En Next.js 15, router.refresh() est la méthode recommandée
        // Pour l'instant, on utilise window.location.reload() mais on pourrait améliorer
        window.location.reload();
      } else {
        setErrors({
          submit:
            result.error ??
            "Erreur inconnue lors de la création de l'utilisateur",
        });
      }
    } catch (err: unknown) {
      console.error('Erreur handleSubmit:', err);

      // Gestion d'erreurs plus robuste avec messages user-friendly
      let errorMessage = "Une erreur inattendue s'est produite";

      if (err instanceof TypeError && err.message?.includes('fetch')) {
        errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowPassword(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border-black">
        <DialogHeader>
          <DialogTitle className="text-black">
            Créer un nouvel utilisateur
          </DialogTitle>
          <DialogDescription className="text-black opacity-70">
            Ajoutez un nouvel utilisateur au système Vérone avec ses
            permissions.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch((error: unknown) => {
              console.error('[CreateUserDialog] Form submit failed:', error);
              setErrors({
                submit:
                  error instanceof Error
                    ? error.message
                    : "Une erreur inattendue s'est produite",
              });
            });
          }}
          className="space-y-4"
        >
          {/* Informations de connexion */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-black">
              Informations de connexion
            </h3>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="utilisateur@exemple.com"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">
                Mot de passe temporaire <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe temporaire"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className="pr-10 border-black focus:ring-black"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black opacity-50 hover:opacity-70"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
              <p className="text-xs text-black opacity-50">
                L'utilisateur devra changer ce mot de passe lors de sa première
                connexion
              </p>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-black">
                Rôle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={value =>
                  handleInputChange('role', value as UserRole)
                }
              >
                <SelectTrigger className="border-black focus:ring-black">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <RoleBadge role="admin" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="flex items-center space-x-2">
                      <RoleBadge role="owner" />
                      <span>Owner</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-black">
              Informations personnelles (optionnelles)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-black">
                  Prénom
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    className="pl-10 border-black focus:ring-black"
                    maxLength={50}
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-black">
                  Nom de famille
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Nom de famille"
                    value={formData.lastName}
                    onChange={e =>
                      handleInputChange('lastName', e.target.value)
                    }
                    className="pl-10 border-black focus:ring-black"
                    maxLength={50}
                    disabled={isLoading}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-black">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0X XX XX XX XX"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
              <p className="text-xs text-black opacity-50">
                Format français : 0123456789 ou +33123456789
              </p>
            </div>

            {/* Poste */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-black">
                Intitulé de poste
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                <Input
                  id="jobTitle"
                  type="text"
                  placeholder="Fonction ou poste"
                  value={formData.jobTitle}
                  onChange={e => handleInputChange('jobTitle', e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                  maxLength={100}
                  disabled={isLoading}
                />
              </div>
              {errors.jobTitle && (
                <p className="text-xs text-red-500">{errors.jobTitle}</p>
              )}
            </div>
          </div>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="p-3 border border-red-300 bg-red-50 rounded">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <ButtonV2
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              Créer l'utilisateur
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
