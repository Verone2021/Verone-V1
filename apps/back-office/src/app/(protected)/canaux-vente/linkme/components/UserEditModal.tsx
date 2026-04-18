'use client';

import { useState, useEffect } from 'react';

import { AlertCircle, Check, Loader2, User, X } from 'lucide-react';

import {
  useUpdateLinkMeUser,
  useLinkMeEnseignesSelect,
  useLinkMeOrganisationsSelect,
  type LinkMeUser,
  type LinkMeRole,
  type UpdateLinkMeUserInput,
} from '../hooks/use-linkme-users';

import { ProfileSection } from './user-edit/ProfileSection';
import { PasswordSection } from './user-edit/PasswordSection';
import { RoleSection } from './user-edit/RoleSection';

interface UserEditModalProps {
  isOpen: boolean;
  user: LinkMeUser;
  onClose: () => void;
}

interface ApiErrorResponse {
  success: false;
  message?: string;
}

export function UserEditModal({ isOpen, user, onClose }: UserEditModalProps) {
  const updateUser = useUpdateLinkMeUser();
  const { data: enseignes } = useLinkMeEnseignesSelect();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<LinkMeRole>('enseigne_admin');
  const [enseigneId, setEnseigneId] = useState<string>('');
  const [organisationId, setOrganisationId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: organisations } = useLinkMeOrganisationsSelect(
    role === 'organisation_admin' ? undefined : (enseigneId ?? undefined)
  );

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
    if (!firstName) newErrors.firstName = 'Prenom requis';
    if (!lastName) newErrors.lastName = 'Nom requis';
    if (!email) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Email invalide';
    if (
      (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
      !enseigneId
    )
      newErrors.enseigneId = 'Enseigne requise pour ce role';
    if (role === 'organisation_admin' && !organisationId)
      newErrors.organisationId =
        'Organisation requise pour un Admin Organisation';
    if (newPassword) {
      if (newPassword.length < 8)
        newErrors.newPassword =
          'Le mot de passe doit contenir au moins 8 caracteres';
      if (newPassword !== confirmPassword)
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (email !== user.email) {
        setIsUpdatingEmail(true);
        const emailResponse = await fetch('/api/linkme/users/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.user_id, new_email: email }),
        });
        if (!emailResponse.ok) {
          const errorData = (await emailResponse.json()) as ApiErrorResponse;
          throw new Error(
            errorData.message ?? "Erreur lors de la modification de l'email"
          );
        }
        setIsUpdatingEmail(false);
      }
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
      const input: UpdateLinkMeUserInput = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        role,
        enseigne_id: enseigneId || null,
        organisation_id: organisationId || null,
        is_active: isActive,
      };
      await updateUser.mutateAsync({ userId: user.user_id, input });
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
  const isPending =
    isUpdatingEmail || isUpdatingPassword || updateUser.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative min-h-screen flex items-end md:items-center justify-center md:p-4">
        <div className="relative bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full md:max-w-lg h-full md:h-auto md:max-h-[90vh] flex flex-col">
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

          <form
            id="edit-user-form"
            onSubmit={e => {
              void handleSubmit(e).catch(err => {
                console.error('[UserEditModal] handleSubmit failed:', err);
              });
            }}
            className="p-6 space-y-5 overflow-y-auto flex-1"
          >
            <ProfileSection
              firstName={firstName}
              lastName={lastName}
              email={email}
              phone={phone}
              originalEmail={user.email ?? ''}
              errors={errors}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onEmailChange={setEmail}
              onPhoneChange={setPhone}
            />
            <PasswordSection
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              errors={errors}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onToggleShowPassword={() => setShowPassword(p => !p)}
              onToggleShowConfirmPassword={() =>
                setShowConfirmPassword(p => !p)
              }
            />
            <RoleSection
              role={role}
              enseigneId={enseigneId}
              organisationId={organisationId}
              isActive={isActive}
              enseignes={enseignes}
              organisations={organisations}
              errors={errors}
              onRoleChange={setRole}
              onEnseigneChange={setEnseigneId}
              onOrganisationChange={setOrganisationId}
              onActiveChange={setIsActive}
            />
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

          <div className="flex flex-col gap-2 md:flex-row px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-full md:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="edit-user-form"
              disabled={isPending}
              className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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
