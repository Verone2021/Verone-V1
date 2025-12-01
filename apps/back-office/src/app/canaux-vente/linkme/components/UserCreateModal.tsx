'use client';

import { useState, useEffect } from 'react';

import { cn } from '@verone/utils';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Store,
  ShoppingCart,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';

import {
  useCreateLinkMeUser,
  useLinkMeEnseignesSelect,
  useLinkMeOrganisationsSelect,
  type LinkMeRole,
  type CreateLinkMeUserInput,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_PERMISSIONS,
} from '../hooks/use-linkme-users';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de création d'utilisateur LinkMe
 */
export function UserCreateModal({ isOpen, onClose }: UserCreateModalProps) {
  const createUser = useCreateLinkMeUser();
  const { data: enseignes } = useLinkMeEnseignesSelect();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<LinkMeRole>('client');
  const [enseigneId, setEnseigneId] = useState<string>('');
  const [organisationId, setOrganisationId] = useState<string>('');

  // Fetch organisations basées sur l'enseigne sélectionnée
  const { data: organisations } = useLinkMeOrganisationsSelect(
    enseigneId || undefined
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setRole('client');
      setEnseigneId('');
      setOrganisationId('');
      setErrors({});
    }
  }, [isOpen]);

  // Reset organisation when enseigne changes
  useEffect(() => {
    setOrganisationId('');
  }, [enseigneId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (!firstName) {
      newErrors.firstName = 'Prénom requis';
    }

    if (!lastName) {
      newErrors.lastName = 'Nom requis';
    }

    if (role === 'enseigne_admin' && !enseigneId) {
      newErrors.enseigneId = 'Enseigne requise pour un Admin Enseigne';
    }

    if (role === 'organisation_admin' && !organisationId) {
      newErrors.organisationId =
        'Organisation requise pour un Admin Organisation';
    }

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
      console.error('Erreur création utilisateur:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Nouvel utilisateur</h2>
                <p className="text-sm text-gray-500">Créer un compte LinkMe</p>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  placeholder="utilisateur@exemple.com"
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
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className={cn(
                    'w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                    errors.password
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Nom / Prénom */}
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
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
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

            {/* Rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    'enseigne_admin',
                    'organisation_admin',
                    'client',
                  ] as LinkMeRole[]
                ).map(r => {
                  const Icon =
                    r === 'enseigne_admin'
                      ? Building2
                      : r === 'organisation_admin'
                        ? Store
                        : ShoppingCart;
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
                          'text-xs font-medium',
                          isSelected ? 'text-blue-700' : 'text-gray-600'
                        )}
                      >
                        {LINKME_ROLE_LABELS[r]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Permissions du rôle */}
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
                  Enseigne {role === 'enseigne_admin' ? '*' : ''}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={enseigneId}
                    onChange={e => setEnseigneId(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none',
                      errors.enseigneId
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    )}
                  >
                    <option value="">Sélectionner une enseigne</option>
                    {enseignes?.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.enseigneId && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.enseigneId}
                  </p>
                )}
              </div>
            )}

            {/* Organisation (si organisation_admin) */}
            {role === 'organisation_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation *
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={organisationId}
                    onChange={e => setOrganisationId(e.target.value)}
                    disabled={!enseigneId && role === 'organisation_admin'}
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none',
                      errors.organisationId
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500',
                      !enseigneId && 'bg-gray-100 cursor-not-allowed'
                    )}
                  >
                    <option value="">
                      {enseigneId
                        ? 'Sélectionner une organisation'
                        : "Choisir d'abord une enseigne"}
                    </option>
                    {organisations?.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.organisationId && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.organisationId}
                  </p>
                )}
              </div>
            )}

            {/* Error global */}
            {createUser.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {createUser.error instanceof Error
                    ? createUser.error.message
                    : 'Erreur lors de la création'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createUser.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {createUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Créer l'utilisateur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
