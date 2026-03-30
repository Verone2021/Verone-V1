'use client';

import { useEffect, useState } from 'react';
import type React from 'react';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

interface UserProfile {
  user_id: string;
  scopes: never[];
  partner_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
  app_source?: string | null;
  avatar_url?: string | null;
  client_type?: string | null;
  email?: string | null;
  user_type?: string | null;
}

interface EditData {
  email: string;
  raw_user_meta_data: { name: string };
  first_name: string;
  last_name: string;
  phone: string;
  job_title: string;
}

interface UseProfileLoadResult {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  userRole: string | null;
  loading: boolean;
  editData: EditData;
  setUser: (user: SupabaseUser) => void;
  setProfile: (profile: UserProfile) => void;
  setEditData: React.Dispatch<React.SetStateAction<EditData>>;
}

export function useProfileLoad(): UseProfileLoadResult {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<EditData>({
    email: '',
    raw_user_meta_data: { name: '' },
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        console.error('Error fetching user:', userError);
        return;
      }

      setUser(currentUser);
      const metadata = currentUser.user_metadata as
        | { name?: string }
        | undefined;
      setEditData({
        email: currentUser.email ?? '',
        raw_user_meta_data: {
          name: metadata?.name ?? currentUser.email?.split('@')[0] ?? '',
        },
        first_name: '',
        last_name: '',
        phone: '',
        job_title: '',
      });

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_app_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('app', 'back-office')
        .eq('is_active', true)
        .single();

      setUserRole(roleData?.role ?? null);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile({
          ...profileData,
          scopes: [],
          created_at: profileData.created_at ?? new Date().toISOString(),
          updated_at: profileData.updated_at ?? new Date().toISOString(),
        });
        setEditData(prev => ({
          ...prev,
          first_name: profileData.first_name ?? '',
          last_name: profileData.last_name ?? '',
          phone: profileData.phone ?? '',
          job_title: profileData.job_title ?? '',
        }));
      }

      setLoading(false);
    };

    void loadUserData().catch(error => {
      console.error('[ProfilePage] useEffect loadUserData failed:', error);
    });
  }, []);

  return {
    user,
    profile,
    userRole,
    loading,
    editData,
    setUser,
    setProfile,
    setEditData,
  };
}
