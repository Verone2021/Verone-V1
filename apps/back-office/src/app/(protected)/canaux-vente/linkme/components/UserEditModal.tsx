'use client';

import { useState, useEffect } from 'react';

import { Combobox } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  Store,
  AlertCircle,
  Check,
  Loader2,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  useUpdateLinkMeUser,
  useLinkMeEnseignesSelect,
  useLinkMeOrganisationsSelect,
  type LinkMeUser,
  type LinkMeRole,
  type UpdateLinkMeUserInput,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_PERMISSIONS,
} from '../hooks/use-linkme-users';

interface UserEditModalProps {
  isOpen: boolean;
  user: LinkMeUser;
  onClose: () => void;
}

interface ApiErrorResponse {
  success: false;
  message?: string;
}

/**
 * Modal de modification d'un utilisateur LinkMe
 */
export function UserEditModal({ isOpen, user, onClose }: UserEditModalProps) {
  const updateUser = useUpdateLinkMeUser();
  const { data: enseignes } = useLinkMeEnseignesSelect();

  // Form state - Section Profil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Form state - Section Role
  const [role, setRole] = useState<LinkMeRole>('enseigne_admin');
  const [enseigneId, setEnseigneId] = useState<string>('');
  const [organisationId, setOrganisationId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // Form state - Section Mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Fetch organisations basées sur l'enseigne sélectionnée
  // Pour organisation_admin: charge TOUTES les organisations (sans filtre enseigne)
  const { data: organisations } = useLinkMeOrganisationsSelect(
    role === 'organisation_admin' ? undefined : (enseigneId ?? undefined)
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les valeurs de l'utilisateur
  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.first_name ?? '');
      setLastName(user.last_name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setRole(user.linkme_role);
      setEnseigneId(user.enseigne_id ?? '');
      setOrganisationId(user.organisation_id ?? '');
      setIsActive(user.is_active);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName) {
      newErrors.firstName = 'Prénom requis';
    }

    if (!lastName) {
      newErrors.lastName = 'Nom requis';
    }

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (role === 'enseigne_admin' && !enseigneId) {
      newErrors.enseigneId = 'Enseigne requise pour un Admin Enseigne';
    }

    if (role === 'organisation_admin' && !organisationId) {
      newErrors.organisationId =
        'Organisation requise pour un Admin Organisation';
    }

    // Validation mot de passe (si rempli)
    if (newPassword) {
      if (newPassword.length < 8) {
        newErrors.newPassword =
          'Le mot de passe doit contenir au moins 8 caractères';
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // 1. Mise à jour email si modifié
      if (email !== user.email) {
        setIsUpdatingEmail(true);
        const emailResponse = await fetch('/api/linkme/users/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.user_id,
            new_email: email,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = (await emailResponse.json()) as ApiErrorResponse;
          throw new Error(
            errorData.message ?? "Erreur lors de la modification de l'email"
          );
        }
        setIsUpdatingEmail(false);
      }

      // 2. Mise à jour mot de passe si rempli
      if (newPassword) {
        setIsUpdatingPassword(true);
        const passwordResponse = await fetch(
          '/api/linkme/users/reset-password',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.user_id,
              new_password: newPassword,
            }),
          }
        );

        if (!passwordResponse.ok) {
          const errorData = (await passwordResponse.json()) as ApiErrorResponse;
          throw new Error(
            errorData.message ??
              'Erreur lors de la modification du mot de passe'
          );
        }
        setIsUpdatingPassword(false);
      }

      // 3. Mise à jour profil et rôle
      const input: UpdateLinkMeUserInput = {
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? undefined,
        role,
        enseigne_id: enseigneId ?? null,
        organisation_id: organisationId ?? null,
        is_active: isActive,
      };

      await updateUser.mutateAsync({
        userId: user.user_id,
        input,
      });

      onClose();
    } catch (error) {
      console.error('Erreur modification utilisateur:', error);
      setIsUpdatingEmail(false);
      setIsUpdatingPassword(false);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la modification',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Modifier utilisateur</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form
            id="edit-user-form"
            onSubmit={e => {
              void handleSubmit(e).catch(error => {
                console.error('[UserEditModal] handleSubmit failed:', error);
              });
            }}
            className="p-6 space-y-5 overflow-y-auto flex-1"
          >
            {/* === SECTION 1: PROFIL === */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Informations personnelles
              </h3>

              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                      errors.firstName
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    )}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                      errors.lastName
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    )}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                      errors.email
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
                {email !== user.email && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    L'email sera modifié dans le système d'authentification
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* === SECTION 2: MOT DE PASSE === */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Mot de passe
                <span className="text-xs font-normal text-gray-500">
                  (optionnel)
                </span>
              </h3>

              <p className="text-xs text-gray-500">
                Laissez vide pour ne pas modifier le mot de passe.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className={cn(
                        'w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2',
                        errors.newPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer"
                      className={cn(
                        'w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2',
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Validation visuelle */}
              {newPassword && (
                <div className="text-xs space-y-1">
                  <div
                    className={`flex items-center space-x-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}
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
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['enseigne_admin', 'organisation_admin'] as LinkMeRole[]).map(
                  r => {
                    const Icon = r === 'enseigne_admin' ? Building2 : Store;
                    const isSelected = role === r;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium text-center',
                            isSelected ? 'text-blue-700' : 'text-gray-600'
                          )}
                        >
                          {LINKME_ROLE_LABELS[r]}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Permissions du role */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Permissions :
                </p>
                <ul className="space-y-1">
                  {LINKME_ROLE_PERMISSIONS[role].map((perm, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enseigne (si enseigne_admin ou organisation_admin) */}
            {(role === 'enseigne_admin' || role === 'organisation_admin') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    Enseigne {role === 'enseigne_admin' ? '*' : ''}
                  </div>
                </label>
                <Combobox
                  options={
                    enseignes?.map(e => ({
                      value: e.id,
                      label: e.name,
                    })) ?? []
                  }
                  value={enseigneId}
                  onValueChange={value => {
                    setEnseigneId(value);
                    setOrganisationId(''); // Reset organisation quand enseigne change
                  }}
                  placeholder="Sélectionner une enseigne"
                  searchPlaceholder="Rechercher une enseigne..."
                  emptyMessage="Aucune enseigne trouvée"
                  variant={errors.enseigneId ? 'error' : 'default'}
                  error={errors.enseigneId}
                />
              </div>
            )}

            {/* Organisation (si organisation_admin) */}
            {role === 'organisation_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-400" />
                    Organisation *
                  </div>
                </label>
                <Combobox
                  options={
                    organisations?.map(o => ({
                      value: o.id,
                      label: o.name,
                    })) ?? []
                  }
                  value={organisationId}
                  onValueChange={setOrganisationId}
                  placeholder="Sélectionner une organisation"
                  searchPlaceholder="Rechercher une organisation..."
                  emptyMessage="Aucune organisation trouvée"
                  variant={errors.organisationId ? 'error' : 'default'}
                  error={errors.organisationId}
                />
              </div>
            )}

            {/* Statut actif/inactif */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Utilisateur actif
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-7">
                Un utilisateur inactif ne peut pas se connecter
              </p>
            </div>

            {/* Error global */}
            {(updateUser.error ?? errors.submit) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {errors.submit ||
                    (updateUser.error instanceof Error
                      ? updateUser.error.message
                      : 'Erreur lors de la modification')}
                </p>
              </div>
            )}
          </form>

          {/* Footer Actions - Fixed */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={
                isUpdatingEmail || isUpdatingPassword || updateUser.isPending
              }
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="edit-user-form"
              disabled={
                isUpdatingEmail || isUpdatingPassword || updateUser.isPending
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isUpdatingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Modification email...
                </>
              ) : isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Modification mot de passe...
                </>
              ) : updateUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Modification profil...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
