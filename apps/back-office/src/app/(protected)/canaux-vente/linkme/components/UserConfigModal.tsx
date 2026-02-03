'use client';

import { useState, useEffect } from 'react';

import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  X,
  User,
  Phone,
  Mail,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
  AlertTriangle,
  Settings,
  Wallet,
} from 'lucide-react';

import {
  useUpdateLinkMeUser,
  type LinkMeUser,
  type UpdateLinkMeUserInput,
} from '../hooks/use-linkme-users';

interface UserConfigModalProps {
  isOpen: boolean;
  user: LinkMeUser;
  onClose: () => void;
}

type TabType = 'profile' | 'security' | 'remuneration';

interface AffiliateData {
  id: string;
  default_margin_rate: number;
  linkme_commission_rate: number;
}

interface ApiErrorResponse {
  success: false;
  message?: string;
}

/**
 * Modal unifié de configuration utilisateur LinkMe
 * - Onglet Profil : prénom, nom, téléphone
 * - Onglet Sécurité : réinitialisation mot de passe
 */
export function UserConfigModal({
  isOpen,
  user,
  onClose,
}: UserConfigModalProps) {
  const updateUser = useUpdateLinkMeUser();

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & error states
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Remuneration state
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(
    null
  );
  const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les valeurs de l'utilisateur
  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.first_name ?? '');
      setLastName(user.last_name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setPasswordError(null);
      setPasswordSuccess(false);
      setErrors({});
      setActiveTab('profile');

      // Récupérer les données de l'affilié
      async function fetchAffiliateData() {
        if (!user.enseigne_id && !user.organisation_id) {
          setAffiliateData(null);
          return;
        }

        setIsLoadingAffiliate(true);
        const supabase = createClient();

        try {
          let query = supabase
            .from('linkme_affiliates')
            .select('id, default_margin_rate, linkme_commission_rate');

          if (user.enseigne_id) {
            query = query.eq('enseigne_id', user.enseigne_id);
          } else if (user.organisation_id) {
            query = query.eq('organisation_id', user.organisation_id);
          }

          const { data, error } = await query.single();

          if (error) {
            console.error('Erreur fetch affiliate:', error);
            setAffiliateData(null);
          } else if (data) {
            setAffiliateData(data as AffiliateData);
          }
        } catch (err) {
          console.error('Erreur fetch affiliate:', err);
        } finally {
          setIsLoadingAffiliate(false);
        }
      }

      // Charger les données affilié pour l'onglet Rémunération
      void fetchAffiliateData().catch(error => {
        console.error('[UserConfigModal] fetchAffiliateData failed:', error);
      });
    }
  }, [isOpen, user]);

  // Validation profil
  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Format email invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation mot de passe
  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = 'Mot de passe requis';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Minimum 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) return;

    try {
      // 1. Mettre à jour l'email si changé
      const emailChanged =
        email.trim().toLowerCase() !== user.email.toLowerCase();
      if (emailChanged) {
        setIsUpdatingEmail(true);
        const emailResponse = await fetch('/api/linkme/users/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.user_id,
            new_email: email.trim(),
          }),
        });

        if (!emailResponse.ok) {
          const data = (await emailResponse.json()) as ApiErrorResponse;
          setErrors({ email: data.message ?? 'Erreur modification email' });
          setIsUpdatingEmail(false);
          return;
        }
        setIsUpdatingEmail(false);
      }

      // 2. Mettre à jour le profil
      const input: UpdateLinkMeUserInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() ?? undefined,
        role: user.linkme_role,
        enseigne_id: user.enseigne_id,
        organisation_id: user.organisation_id,
        is_active: user.is_active,
      };

      await updateUser.mutateAsync({
        userId: user.user_id,
        input,
      });
      onClose();
    } catch (error) {
      console.error('Erreur modification profil:', error);
    }
  };

  // Submit mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsPasswordLoading(true);
    setPasswordError(null);

    try {
      const response = await fetch('/api/linkme/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          new_password: newPassword,
        }),
      });

      const data = (await response.json()) as ApiErrorResponse;

      if (!response.ok) {
        throw new Error(data.message ?? 'Erreur lors de la réinitialisation');
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsPasswordLoading(false);
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
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Configurer le profil</h2>
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <User className="h-4 w-4" />
              Profil
            </button>
            <button
              onClick={() => setActiveTab('remuneration')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'remuneration'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Wallet className="h-4 w-4" />
              Rémunération
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'security'
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Key className="h-4 w-4" />
              Sécurité
            </button>
          </div>

          {/* Content */}
          {activeTab === 'profile' ? (
            <form
              onSubmit={e => {
                void handleProfileSubmit(e).catch(error => {
                  console.error(
                    '[UserConfigModal] handleProfileSubmit failed:',
                    error
                  );
                });
              }}
              className="p-6 space-y-5"
            >
              {/* Prénom */}
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

              {/* Nom */}
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
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Téléphone */}
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

              {/* Error global */}
              {updateUser.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">
                    {updateUser.error instanceof Error
                      ? updateUser.error.message
                      : 'Erreur lors de la modification'}
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
                  disabled={updateUser.isPending || isUpdatingEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {updateUser.isPending || isUpdatingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : activeTab === 'remuneration' ? (
            <div className="p-6 space-y-5">
              {isLoadingAffiliate ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : !affiliateData ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    Aucune donnée de rémunération disponible
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    L&apos;utilisateur n&apos;est pas rattaché à un affilié
                  </p>
                </div>
              ) : (
                <>
                  {/* Margin Rate - Read only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux de marge par défaut
                    </label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      {affiliateData.default_margin_rate}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Modifiable dans les paramètres de l&apos;enseigne
                    </p>
                  </div>

                  {/* Commission Rate - Read only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux commission LinkMe
                    </label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      {affiliateData.linkme_commission_rate}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Modifiable dans les paramètres de l&apos;enseigne
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : passwordSuccess ? (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700">
                  Mot de passe réinitialisé
                </h3>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  L&apos;utilisateur peut maintenant se connecter avec son
                  nouveau mot de passe
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={e => {
                void handlePasswordSubmit(e).catch(error => {
                  console.error(
                    '[UserConfigModal] handlePasswordSubmit failed:',
                    error
                  );
                });
              }}
              className="p-6 space-y-5"
            >
              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Attention</p>
                  <p className="text-amber-700">
                    Le mot de passe actuel sera remplacé. L&apos;utilisateur
                    devra utiliser le nouveau mot de passe pour se connecter.
                  </p>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className={cn(
                      'w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                      errors.newPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2',
                      errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    )}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Error global */}
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{passwordError}</p>
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
                  disabled={isPasswordLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Réinitialiser
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
