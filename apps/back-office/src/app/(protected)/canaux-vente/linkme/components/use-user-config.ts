'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import {
  useUpdateLinkMeUser,
  type LinkMeUser,
  type UpdateLinkMeUserInput,
} from '../hooks/use-linkme-users';

export type TabType = 'profile' | 'security' | 'remuneration';

export interface AffiliateData {
  id: string;
  default_margin_rate: number;
  linkme_commission_rate: number;
}

interface ApiErrorResponse {
  success: false;
  message?: string;
}

export function useUserConfig(isOpen: boolean, user: LinkMeUser, onClose: () => void) {
  const updateUser = useUpdateLinkMeUser();

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
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

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

      void fetchAffiliateData().catch(error => {
        console.error('[UserConfigModal] fetchAffiliateData failed:', error);
      });
    }
  }, [isOpen, user]);

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) return;

    try {
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

  return {
    // Tab
    activeTab,
    setActiveTab,
    // Profile state
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    isUpdatingEmail,
    // Password state
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isPasswordLoading,
    passwordError,
    passwordSuccess,
    // Remuneration state
    affiliateData,
    isLoadingAffiliate,
    // Validation
    errors,
    // Mutation
    updateUser,
    // Handlers
    handleProfileSubmit,
    handlePasswordSubmit,
  };
}
