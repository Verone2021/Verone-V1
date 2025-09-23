"use client"

import React, { useEffect, useState } from 'react'
import { User, Mail, Shield, Building, Edit, Save, X, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge, type UserRole } from '@/components/ui/role-badge'
import { PasswordChangeDialog } from '@/components/profile/password-change-dialog'
import { validateProfileForm, sanitizeProfileData } from '@/lib/validation/profile-validation'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserProfile {
  user_id: string
  role: string
  scopes: string[]
  partner_id: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  job_title?: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [editData, setEditData] = useState({
    email: '',
    raw_user_meta_data: { name: '' },
    first_name: '',
    last_name: '',
    phone: '',
    job_title: ''
  })

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error fetching user:', userError)
        return
      }

      setUser(user)

      // Initialize edit data
      setEditData({
        email: user.email || '',
        raw_user_meta_data: {
          name: user.user_metadata?.name || user.email?.split('@')[0] || ''
        },
        first_name: '',
        last_name: '',
        phone: '',
        job_title: ''
      })

      // Get user profile with extended fields
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData)
        // Update edit data with profile info
        setEditData(prevData => ({
          ...prevData,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          job_title: profileData.job_title || ''
        }))
      }

      setLoading(false)
    }

    loadUserData()
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return

    // Validation des données
    const validationResult = validateProfileForm({
      displayName: editData.raw_user_meta_data.name,
      firstName: editData.first_name,
      lastName: editData.last_name,
      phone: editData.phone,
      jobTitle: editData.job_title
    })

    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors)
      return
    }

    setValidationErrors({})

    try {
      setSaveLoading(true)
      const supabase = createClient()

      // Update auth user metadata (for display name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: editData.raw_user_meta_data
      })

      if (updateError) {
        console.error('Error updating auth metadata:', updateError)
        return
      }

      // Update user profile with validated and sanitized data
      const sanitizedData = sanitizeProfileData(validationResult.formatted)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(sanitizedData)
        .eq('user_id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        return
      }

      // Refresh user data
      const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser()
      if (!userError && updatedUser) {
        setUser(updatedUser)
      }

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-logo text-2xl font-light tracking-wider text-black">
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-black" />
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-black">Mon Profil</h1>
                {profile && (
                  <RoleBadge role={profile.role as UserRole} />
                )}
              </div>
              <p className="text-black opacity-70">Informations de votre compte Vérone</p>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveLoading ? 'Sauvegarde...' : 'Enregistrer'}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile information */}
      <div className="max-w-2xl">
        <div className="bg-white border border-black p-6 space-y-6">
          <h2 className="text-lg font-semibold text-black">Informations personnelles</h2>

          <div className="grid grid-cols-1 gap-6">
            {/* Nom d'affichage */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-1">Nom d'affichage</p>
                {isEditing ? (
                  <Input
                    value={editData.raw_user_meta_data.name}
                    onChange={(e) => setEditData({
                      ...editData,
                      raw_user_meta_data: {
                        ...editData.raw_user_meta_data,
                        name: e.target.value
                      }
                    })}
                    className="border-black focus:ring-black"
                    placeholder="Nom d'affichage"
                  />
                ) : (
                  <p className="text-black font-medium">
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Non défini'}
                  </p>
                )}
                {validationErrors.displayName && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.displayName}</p>
                )}
              </div>
            </div>

            {/* Prénom */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-1">Prénom <span className="text-xs opacity-60">(optionnel)</span></p>
                {isEditing ? (
                  <Input
                    value={editData.first_name}
                    onChange={(e) => setEditData({
                      ...editData,
                      first_name: e.target.value
                    })}
                    className="border-black focus:ring-black"
                    placeholder="Votre prénom"
                    maxLength={50}
                  />
                ) : (
                  <p className="text-black font-medium">
                    {profile?.first_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                )}
              </div>
            </div>

            {/* Nom de famille */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-1">Nom de famille <span className="text-xs opacity-60">(optionnel)</span></p>
                {isEditing ? (
                  <Input
                    value={editData.last_name}
                    onChange={(e) => setEditData({
                      ...editData,
                      last_name: e.target.value
                    })}
                    className="border-black focus:ring-black"
                    placeholder="Votre nom de famille"
                    maxLength={50}
                  />
                ) : (
                  <p className="text-black font-medium">
                    {profile?.last_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-1">Téléphone <span className="text-xs opacity-60">(optionnel)</span></p>
                {isEditing ? (
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({
                      ...editData,
                      phone: e.target.value
                    })}
                    className="border-black focus:ring-black"
                    placeholder="0X XX XX XX XX ou +33 X XX XX XX XX"
                    type="tel"
                  />
                ) : (
                  <p className="text-black font-medium">
                    {profile?.phone || 'Non renseigné'}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-black opacity-50 mt-1">
                    Format français accepté : 0123456789 ou +33123456789
                  </p>
                )}
                {validationErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Intitulé de poste */}
            <div className="flex items-center space-x-3">
              <Briefcase className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-1">Intitulé de poste <span className="text-xs opacity-60">(optionnel)</span></p>
                {isEditing ? (
                  <Input
                    value={editData.job_title}
                    onChange={(e) => setEditData({
                      ...editData,
                      job_title: e.target.value
                    })}
                    className="border-black focus:ring-black"
                    placeholder="Votre fonction/poste"
                    maxLength={100}
                  />
                ) : (
                  <p className="text-black font-medium">
                    {profile?.job_title || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.jobTitle && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.jobTitle}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60">Email</p>
                <p className="text-black font-medium">{user?.email}</p>
                {isEditing && (
                  <p className="text-xs text-black opacity-50 mt-1">
                    L'email ne peut pas être modifié depuis cette interface
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-black opacity-60" />
              <div className="flex-1">
                <p className="text-sm text-black opacity-60 mb-2">Rôle et permissions</p>
                {profile && (
                  <RoleBadge role={profile.role as UserRole} className="mb-2" />
                )}
              </div>
            </div>

            {/* Organisation */}
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-black opacity-60" />
              <div>
                <p className="text-sm text-black opacity-60">Organisation</p>
                <p className="text-black font-medium">Vérone</p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-black opacity-60" />
              <div>
                <p className="text-sm text-black opacity-60">ID Utilisateur</p>
                <p className="text-black font-medium font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="pt-4 border-t border-black">
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
                onClick={() => setShowPasswordDialog(true)}
              >
                Changer le mot de passe
              </Button>
              {profile?.role === 'owner' && (
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white"
                >
                  Paramètres système
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  )
}