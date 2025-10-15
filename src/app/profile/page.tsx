"use client"

import React, { useEffect, useState } from 'react'
import { User, Mail, Shield, Building, Edit, Save, X, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge, type UserRole } from '@/components/ui/role-badge'
import { PasswordChangeDialog } from '@/components/profile/password-change-dialog'
import { validateProfileForm, sanitizeProfileData } from '@/lib/validation/profile-validation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { colors, spacing, componentShadows } from '@/lib/design-system'
import { cn } from '@/lib/utils'

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
      console.log('🔍 Diagnostic profile update:', {
        user_id: user.id,
        sanitizedData,
        originalFormData: validationResult.formatted
      })

      // Vérifier si le profil existe avant update
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (checkError) {
        console.error('❌ Erreur vérification profil existant:', checkError)
        console.log('Profil inexistant - tentative de création')

        // Profil n'existe pas, le créer
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...sanitizedData
          })

        if (createError) {
          console.error('❌ Erreur création profil:', {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code
          })
          return
        }
        console.log('✅ Profil créé avec succès')
      } else {
        console.log('✅ Profil existant trouvé, tentative update')

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(sanitizedData)
          .eq('user_id', user.id)

        if (profileError) {
          console.error('❌ Erreur update profil détaillée:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
            errorObject: profileError
          })
          return
        }
        console.log('✅ Profil mis à jour avec succès')
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background.subtle }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.primary[500] }}
          ></div>
          <p style={{ color: colors.text.subtle }}>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.background.subtle,
        padding: spacing[6],
      }}
    >
      {/* Page header */}
      <div
        className="-mx-6 -mt-6 mb-6"
        style={{
          backgroundColor: colors.background.DEFAULT,
          borderBottom: `1px solid ${colors.border.DEFAULT}`,
          padding: `${spacing[4]} ${spacing[6]}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8" style={{ color: colors.text.DEFAULT }} />
            <div>
              <div className="flex items-center space-x-3">
                <h1
                  className="text-2xl font-bold"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Mon Profil
                </h1>
                {profile && (
                  <RoleBadge role={profile.role as UserRole} />
                )}
              </div>
              <p style={{ color: colors.text.subtle }}>
                Informations de votre compte Vérone
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <ButtonV2
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  loading={saveLoading}
                  variant="success"
                  size="sm"
                  icon={Save}
                  iconPosition="left"
                >
                  {saveLoading ? 'Sauvegarde...' : 'Enregistrer'}
                </ButtonV2>
                <ButtonV2
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                  icon={X}
                  iconPosition="left"
                >
                  Annuler
                </ButtonV2>
              </>
            ) : (
              <ButtonV2
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
                icon={Edit}
                iconPosition="left"
              >
                Modifier
              </ButtonV2>
            )}
          </div>
        </div>
      </div>

      {/* Profile information */}
      <div className="max-w-2xl">
        <div
          className="rounded-xl space-y-6"
          style={{
            backgroundColor: colors.background.DEFAULT,
            border: `1px solid ${colors.border.strong}`,
            padding: spacing[6],
            boxShadow: componentShadows.card,
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {/* Nom d'affichage */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: colors.text.subtle }}>
                  Nom d'affichage
                </p>
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
                    placeholder="Nom d'affichage"
                    style={{
                      borderColor: colors.neutral[300],
                    }}
                  />
                ) : (
                  <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Non défini'}
                  </p>
                )}
                {validationErrors.displayName && (
                  <p className="text-xs mt-1" style={{ color: colors.danger[500] }}>
                    {validationErrors.displayName}
                  </p>
                )}
              </div>
            </div>

            {/* Prénom */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: colors.text.subtle }}>
                  Prénom <span className="text-xs">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.first_name}
                    onChange={(e) => setEditData({
                      ...editData,
                      first_name: e.target.value
                    })}
                    placeholder="Votre prénom"
                    maxLength={50}
                    style={{ borderColor: colors.neutral[300] }}
                  />
                ) : (
                  <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                    {profile?.first_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.firstName && (
                  <p className="text-xs mt-1" style={{ color: colors.danger[500] }}>
                    {validationErrors.firstName}
                  </p>
                )}
              </div>
            </div>

            {/* Nom de famille */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: colors.text.subtle }}>
                  Nom de famille <span className="text-xs">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.last_name}
                    onChange={(e) => setEditData({
                      ...editData,
                      last_name: e.target.value
                    })}
                    placeholder="Votre nom de famille"
                    maxLength={50}
                    style={{ borderColor: colors.neutral[300] }}
                  />
                ) : (
                  <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                    {profile?.last_name || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.lastName && (
                  <p className="text-xs mt-1" style={{ color: colors.danger[500] }}>
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: colors.text.subtle }}>
                  Téléphone <span className="text-xs">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({
                      ...editData,
                      phone: e.target.value
                    })}
                    placeholder="0X XX XX XX XX ou +33 X XX XX XX XX"
                    type="tel"
                    style={{ borderColor: colors.neutral[300] }}
                  />
                ) : (
                  <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                    {profile?.phone || 'Non renseigné'}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                    Format français accepté : 0123456789 ou +33123456789
                  </p>
                )}
                {validationErrors.phone && (
                  <p className="text-xs mt-1" style={{ color: colors.danger[500] }}>
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Intitulé de poste */}
            <div className="flex items-center space-x-3">
              <Briefcase className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-1" style={{ color: colors.text.subtle }}>
                  Intitulé de poste <span className="text-xs">(optionnel)</span>
                </p>
                {isEditing ? (
                  <Input
                    value={editData.job_title}
                    onChange={(e) => setEditData({
                      ...editData,
                      job_title: e.target.value
                    })}
                    placeholder="Votre fonction/poste"
                    maxLength={100}
                    style={{ borderColor: colors.neutral[300] }}
                  />
                ) : (
                  <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                    {profile?.job_title || 'Non renseigné'}
                  </p>
                )}
                {validationErrors.jobTitle && (
                  <p className="text-xs mt-1" style={{ color: colors.danger[500] }}>
                    {validationErrors.jobTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: colors.text.subtle }}>Email</p>
                <p className="font-medium" style={{ color: colors.text.DEFAULT }}>
                  {user?.email}
                </p>
                {isEditing && (
                  <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                    L'email ne peut pas être modifié depuis cette interface
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div className="flex-1">
                <p className="text-sm mb-2" style={{ color: colors.text.subtle }}>
                  Rôle et permissions
                </p>
                {profile && (
                  <RoleBadge role={profile.role as UserRole} className="mb-2" />
                )}
              </div>
            </div>

            {/* Organisation */}
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>Organisation</p>
                <p className="font-medium" style={{ color: colors.text.DEFAULT }}>Vérone</p>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5" style={{ color: colors.neutral[400] }} />
              <div>
                <p className="text-sm" style={{ color: colors.text.subtle }}>ID Utilisateur</p>
                <p className="font-medium font-mono text-sm" style={{ color: colors.text.DEFAULT }}>
                  {user?.id}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          <div
            className="pt-4"
            style={{
              borderTop: `1px solid ${colors.border.strong}`,
              paddingTop: spacing[4],
            }}
          >
            <div className="flex space-x-4">
              <ButtonV2
                variant="secondary"
                size="md"
                onClick={() => setShowPasswordDialog(true)}
              >
                Changer le mot de passe
              </ButtonV2>
              {profile?.role === 'owner' && (
                <ButtonV2
                  variant="secondary"
                  size="md"
                >
                  Paramètres système
                </ButtonV2>
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