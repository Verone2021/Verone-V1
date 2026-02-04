'use client';

/**
 * Page Profil LinkMe - Version moderne
 *
 * Affiche les informations utilisateur en mode lecture
 * avec possibilité de modifier via un bouton d'édition.
 * Inclut également le changement de mot de passe.
 *
 * @module ProfilPage
 * @since 2025-12-18
 */

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@verone/utils/supabase/client';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useAuth } from '../../../contexts/AuthContext';
import {
  useUserProfile,
  useUpdateProfile,
} from '../../../lib/hooks/use-user-profile';
import {
  profileSchema,
  type ProfileFormData,
} from '../../../lib/schemas/profile.schema';

export default function ProfilPage(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const {
    mutate: updateProfile,
    isPending: isSaving,
    isSuccess,
    isError,
    error,
    reset: resetMutation,
  } = useUpdateProfile();

  // États
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [_showCurrentPassword, _setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Formulaire profil
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      title: '',
    },
  });

  // Formulaire mot de passe
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Vérifier authentification et rôle LinkMe actif
  useEffect(() => {
    if (!loading) {
      // Pas connecté → redirect login
      if (!user) {
        router.push('/login');
        return;
      }

      // Pas de rôle LinkMe actif → redirect dashboard
      // (cohérent avec MainLayout et /catalogue)
      if (!linkMeRole?.is_active) {
        console.warn('[ProfilPage] No active LinkMe role, redirecting');
        router.push('/dashboard');
        return;
      }
    }
  }, [user, linkMeRole, loading, router]);

  // Reset form quand le profil est chargé
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
      });
    }
  }, [profile, reset]);

  // Message de succès temporaire
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      setIsEditing(false);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        resetMutation();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, resetMutation]);

  // Soumettre le formulaire profil
  const onSubmit = (data: ProfileFormData): void => {
    updateProfile(data);
  };

  // Annuler l'édition
  const handleCancelEdit = (): void => {
    setIsEditing(false);
    if (profile) {
      reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
      });
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (): Promise<void> => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordSection(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch {
      setPasswordError('Une erreur est survenue');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loader pendant l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mon profil
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Consultez et gérez vos informations personnelles
          </p>
        </div>

        {/* Message de succès */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              Vos informations ont été mises à jour avec succès.
            </p>
          </div>
        )}

        {/* Message d'erreur */}
        {isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              {error instanceof Error
                ? error.message
                : 'Une erreur est survenue lors de la mise à jour.'}
            </p>
          </div>
        )}

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section Informations personnelles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">
                    Informations personnelles
                  </h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </button>
                )}
              </div>

              <div className="p-6">
                {isEditing ? (
                  /* Mode édition */
                  <form
                    onSubmit={e => {
                      void handleSubmit(onSubmit)(e).catch(error => {
                        console.error('[Profile] Submit failed:', error);
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="first_name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Prénom
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          {...register('first_name')}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            errors.first_name
                              ? 'border-red-300'
                              : 'border-gray-200'
                          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.first_name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="last_name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Nom
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          {...register('last_name')}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            errors.last_name
                              ? 'border-red-300'
                              : 'border-gray-200'
                          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.last_name.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        {...register('phone')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Fonction
                      </label>
                      <input
                        type="text"
                        id="title"
                        {...register('title')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Responsable commercial"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Mode lecture */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Prénom</p>
                        <p className="text-gray-900 font-medium">
                          {profile?.first_name ?? '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nom</p>
                        <p className="text-gray-900 font-medium">
                          {profile?.last_name ?? '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {profile?.phone ?? 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fonction</p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        {profile?.title ?? 'Non renseignée'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Compte */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Compte</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Adresse email</p>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {user.created_at ? formatDate(user.created_at) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section Sécurité */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">Sécurité</h2>
                </div>
                {!showPasswordSection && (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Lock className="h-4 w-4" />
                    Changer le mot de passe
                  </button>
                )}
              </div>

              <div className="p-6">
                {showPasswordSection ? (
                  <div className="space-y-4">
                    {passwordSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm text-green-800">
                          Mot de passe modifié avec succès
                        </p>
                      </div>
                    )}

                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-800">{passwordError}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Min. 6 caractères"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Retapez le mot de passe"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => void handleChangePassword()}
                        disabled={isChangingPassword || !newPassword}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                      >
                        {isChangingPassword ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        Changer le mot de passe
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setPasswordError(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Mot de passe</p>
                    <p className="text-gray-900 font-medium">••••••••••</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
