'use client';

import { useState, useEffect } from 'react';

import { AlertCircle, Check, Loader2, User, X } from 'lucide-react';

import {
  useCreateLinkMeUser,
  useLinkMeEnseignesSelect,
  useLinkMeOrganisationsSelect,
  type LinkMeRole,
  type CreateLinkMeUserInput,
} from '../hooks/use-linkme-users';

import { EmailPasswordSection } from './user-create/EmailPasswordSection';
import { NamePhoneSection } from './user-create/NamePhoneSection';
import { RoleEnseigneSection } from './user-create/RoleEnseigneSection';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserCreateModal({ isOpen, onClose }: UserCreateModalProps) {
  const createUser = useCreateLinkMeUser();
  const { data: enseignes } = useLinkMeEnseignesSelect();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<LinkMeRole>('enseigne_admin');
  const [enseigneId, setEnseigneId] = useState<string>('');
  const [organisationId, setOrganisationId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: organisations } = useLinkMeOrganisationsSelect(
    role === 'organisation_admin' ? undefined : (enseigneId ?? undefined),
    role === 'organisation_admin'
  );

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setRole('enseigne_admin');
      setEnseigneId('');
      setOrganisationId('');
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    setOrganisationId('');
  }, [enseigneId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Email invalide';
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 8) newErrors.password = 'Minimum 8 caracteres';
    if (!firstName) newErrors.firstName = 'Prenom requis';
    if (!lastName) newErrors.lastName = 'Nom requis';
    if (
      (role === 'enseigne_admin' || role === 'enseigne_collaborateur') &&
      !enseigneId
    )
      newErrors.enseigneId = 'Enseigne requise';
    if (role === 'organisation_admin' && !organisationId)
      newErrors.organisationId = 'Organisation requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const input: CreateLinkMeUserInput = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone: phone || undefined,
      role,
      enseigne_id: enseigneId || undefined,
      organisation_id: organisationId || undefined,
    };
    try {
      await createUser.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur creation utilisateur:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative min-h-screen flex items-end md:items-center justify-center md:p-4">
        <div className="relative bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full md:max-w-lg h-full md:h-auto md:max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">
                Nouvel utilisateur LinkMe
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            id="create-user-form"
            onSubmit={e => {
              void handleSubmit(e).catch(err => {
                console.error('[UserCreateModal] handleSubmit failed:', err);
              });
            }}
            className="p-6 space-y-5 overflow-y-auto flex-1"
          >
            <EmailPasswordSection
              email={email}
              password={password}
              showPassword={showPassword}
              errors={errors}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onToggleShowPassword={() => setShowPassword(p => !p)}
            />
            <NamePhoneSection
              firstName={firstName}
              lastName={lastName}
              phone={phone}
              errors={errors}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onPhoneChange={setPhone}
            />
            <RoleEnseigneSection
              role={role}
              enseigneId={enseigneId}
              organisationId={organisationId}
              enseignes={enseignes}
              organisations={organisations}
              errors={errors}
              onRoleChange={setRole}
              onEnseigneChange={setEnseigneId}
              onOrganisationChange={setOrganisationId}
            />
            {createUser.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {createUser.error instanceof Error
                    ? createUser.error.message
                    : 'Erreur lors de la creation'}
                </p>
              </div>
            )}
          </form>

          <div className="flex flex-col gap-2 md:flex-row px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full md:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="create-user-form"
              disabled={createUser.isPending}
              className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {createUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creation...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Creer l&apos;utilisateur
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
