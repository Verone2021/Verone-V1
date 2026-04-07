'use client';

import { cn } from '@verone/utils';
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

import { type LinkMeUser } from '../hooks/use-linkme-users';

import { useUserConfig, type TabType } from './use-user-config';

interface UserConfigModalProps {
  isOpen: boolean;
  user: LinkMeUser;
  onClose: () => void;
}

export function UserConfigModal({
  isOpen,
  user,
  onClose,
}: UserConfigModalProps) {
  const {
    activeTab,
    setActiveTab,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    isUpdatingEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isPasswordLoading,
    passwordError,
    passwordSuccess,
    affiliateData,
    isLoadingAffiliate,
    errors,
    updateUser,
    handleProfileSubmit,
    handlePasswordSubmit,
  } = useUserConfig(isOpen, user, onClose);

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
            {(
              [
                { key: 'profile' as TabType, label: 'Profil', icon: User, color: 'blue' },
                { key: 'remuneration' as TabType, label: 'Rémunération', icon: Wallet, color: 'green' },
                { key: 'security' as TabType, label: 'Sécurité', icon: Key, color: 'amber' },
              ] as const
            ).map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === key
                    ? `text-${color}-600 border-b-2 border-${color}-600 bg-${color}-50/50`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
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
