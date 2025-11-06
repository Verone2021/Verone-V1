'use client'

import { useState } from 'react'
import { Upload, Trash2, Loader2, AlertCircle, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrganisationLogo } from './organisation-logo'
import { useLogoUpload } from '@/shared/modules/common/hooks/use-logo-upload'
import { cn } from '@/lib/utils'
import { spacing, colors } from '@/lib/design-system'
import Image from 'next/image'

interface LogoUploadButtonProps {
  organisationId: string
  organisationName: string
  currentLogoUrl?: string | null
  onUploadSuccess?: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Composant pour upload/supprimer un logo d'organisation avec drag & drop
 *
 * @param organisationId - ID de l'organisation
 * @param organisationName - Nom de l'organisation (pour affichage)
 * @param currentLogoUrl - URL actuelle du logo (path Storage)
 * @param onUploadSuccess - Callback appelé après upload/delete réussi
 * @param size - Taille du logo affiché
 * @param className - Classes CSS additionnelles
 *
 * @example
 * <LogoUploadButton
 *   organisationId={supplier.id}
 *   organisationName={supplier.name}
 *   currentLogoUrl={supplier.logo_url}
 *   onUploadSuccess={() => refetch()}
 *   size="lg"
 * />
 */
export function LogoUploadButton({
  organisationId,
  organisationName,
  currentLogoUrl,
  onUploadSuccess,
  size = 'lg',
  className
}: LogoUploadButtonProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { uploadLogo, deleteLogo, uploading, deleting, error } = useLogoUpload({
    organisationId,
    currentLogoUrl,
    onSuccess: () => {
      setPreviewUrl(null)
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    },
    onError: (err) => {
      console.error('Erreur logo:', err)
    }
  })

  /**
   * Gestion upload d'un fichier
   */
  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Preview local avant upload
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    await uploadLogo(file)
  }

  /**
   * Gestionnaires drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  /**
   * Gestion click pour ouvrir sélecteur de fichiers
   */
  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/svg+xml,image/webp'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    }
    input.click()
  }

  /**
   * Gestion suppression
   */
  const handleDelete = async () => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le logo de "${organisationName}" ?`
    )

    if (confirmed) {
      await deleteLogo()
    }
  }

  const isLoading = uploading || deleting

  // Obtenir l'URL complète du logo depuis Supabase Storage
  const getLogoUrl = () => {
    if (!currentLogoUrl) return null
    if (currentLogoUrl.startsWith('http')) return currentLogoUrl
    // Construire l'URL publique Supabase
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${currentLogoUrl}`
  }

  const logoUrl = getLogoUrl()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone de drag & drop / affichage logo */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer',
          dragActive && 'border-black bg-gray-50',
          error && 'border-red-500 bg-red-50',
          !dragActive && !error && 'border-gray-300 hover:border-gray-400',
          isLoading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!currentLogoUrl ? handleClick : undefined}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Logo actuel ou preview ou placeholder */}
          {logoUrl || previewUrl ? (
            <div className="relative">
              {logoUrl && !previewUrl ? (
                <div className={cn(
                  'relative rounded-md overflow-hidden border border-gray-200',
                  size === 'sm' && 'h-16 w-16',
                  size === 'md' && 'h-24 w-24',
                  size === 'lg' && 'h-32 w-32',
                  size === 'xl' && 'h-40 w-40'
                )}>
                  <Image
                    src={logoUrl}
                    alt={`Logo ${organisationName}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                </div>
              ) : previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={cn(
                      'rounded-md border object-contain',
                      size === 'sm' && 'h-16 w-16',
                      size === 'md' && 'h-24 w-24',
                      size === 'lg' && 'h-32 w-32',
                      size === 'xl' && 'h-40 w-40'
                    )}
                    style={{ borderColor: colors.border.DEFAULT }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}

          {/* Texte indicatif */}
          <div className="text-center">
            <p className="text-sm font-medium text-black">
              {uploading
                ? 'Upload en cours...'
                : currentLogoUrl
                  ? 'Logo actuel'
                  : 'Ajouter un logo'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!currentLogoUrl && 'Cliquez ou glissez-déposez une image'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPEG, SVG, WebP • Max 5 MB
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {currentLogoUrl && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClick}
            disabled={isLoading}
            className={cn(uploading && 'animate-spin')}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            {uploading ? 'Upload...' : 'Remplacer'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className={cn(deleting && 'animate-spin')}
          >
            {deleting ? <Loader2 className="h-4 w-4 mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div
          className="flex items-start gap-2 text-sm p-3 rounded-md border"
          style={{
            backgroundColor: colors.danger[50],
            borderColor: colors.danger[200],
            color: colors.danger[700]
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-xs mt-0.5">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
