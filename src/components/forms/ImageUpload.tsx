"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2, FileText } from "lucide-react"
import { ButtonV2 } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "../../lib/utils"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

type DocumentCategory =
  | 'product_image' | 'category_image' | 'family_image'
  | 'client_document' | 'supplier_document' | 'contract'
  | 'invoice' | 'quote' | 'order' | 'catalog'
  | 'marketing_material' | 'internal_document'

type DocumentType = 'image' | 'document' | 'pdf' | 'video' | 'audio'

interface DocumentMetadata {
  title?: string
  description?: string
  alt_text?: string
  tags?: string[]
  related_entity_type?: string
  related_entity_id?: string
}

interface ImageUploadProps {
  bucket: 'category-images' | 'family-images' | 'product-images' | 'documents'
  category: DocumentCategory
  currentImageUrl?: string
  metadata?: DocumentMetadata
  onImageUpload: (url: string, documentId: string) => void
  onImageRemove: () => void
  className?: string
  maxSizeMB?: number
  allowedTypes?: string[]
  showMetadataForm?: boolean
}

export function ImageUpload({
  bucket,
  category,
  currentImageUrl,
  metadata = {},
  onImageUpload,
  onImageRemove,
  className,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  showMetadataForm = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata>(metadata)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier doit faire moins de ${maxSizeMB}MB`)
      return
    }

    if (!allowedTypes.includes(file.type)) {
      const types = allowedTypes.map(t => t.split('/')[1]).join(', ')
      setError(`Format non supporté. Utilisez: ${types}`)
      return
    }

    setError(null)
    uploadDocument(file)
  }

  const uploadDocument = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      console.log('🚀 Début upload fichier:', file.name, `(${Math.round(file.size / 1024)}KB)`)

      // Générer nom fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${category}/${fileName}`

      console.log('📁 Upload vers:', bucket, filePath)

      // Upload direct vers Supabase Storage - SIMPLIFIÉ
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) {
        console.error('❌ Erreur upload Storage:', uploadError)
        throw new Error(`Upload échoué: ${uploadError.message}`)
      }

      console.log('✅ Upload Storage réussi:', uploadData.path)

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Impossible d\'obtenir l\'URL publique du fichier')
      }

      console.log('🔗 URL publique générée:', urlData.publicUrl)

      // SIMPLIFIÉ: Direct callback sans métadonnées complexes
      onImageUpload(urlData.publicUrl, uploadData.path)

      console.log('🎉 Upload terminé avec succès')

    } catch (error) {
      console.error('💥 Erreur upload:', error)

      // Messages d'erreur utilisateur simplifiés
      if (error?.message?.includes('Bucket not found')) {
        setError('Configuration de stockage invalide. Contactez l\'administrateur.')
      } else if (error?.message?.includes('size')) {
        setError(`Fichier trop volumineux (max ${maxSizeMB}MB)`)
      } else if (error?.message?.includes('policy')) {
        setError('Permissions insuffisantes. Essayez de vous reconnecter.')
      } else {
        setError(error?.message || 'Erreur lors de l\'upload. Réessayez.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const classifyDocumentType = (mimeType: string): DocumentType => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf') return 'pdf'
    return 'document'
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    try {
      // Extraire le chemin du fichier depuis l'URL
      const url = new URL(currentImageUrl)
      const pathParts = url.pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]

      // Supprimer de Supabase Storage
      await supabase.storage
        .from(bucket)
        .remove([fileName])

      onImageRemove()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

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
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Formulaire métadonnées (si activé) */}
      {showMetadataForm && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-sm text-gray-900">Informations du document</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Titre</Label>
              <Input
                id="doc-title"
                value={documentMetadata.title || ''}
                onChange={(e) => setDocumentMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du document"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-alt">Texte alternatif (images)</Label>
              <Input
                id="doc-alt"
                value={documentMetadata.alt_text || ''}
                onChange={(e) => setDocumentMetadata(prev => ({ ...prev, alt_text: e.target.value }))}
                placeholder="Description pour accessibilité"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-desc">Description</Label>
            <Textarea
              id="doc-desc"
              value={documentMetadata.description || ''}
              onChange={(e) => setDocumentMetadata(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée du document"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-tags">Mots-clés (séparés par des virgules)</Label>
            <Input
              id="doc-tags"
              value={documentMetadata.tags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                setDocumentMetadata(prev => ({ ...prev, tags }))
              }}
              placeholder="mobilier, moderne, salon, tendance"
            />
          </div>
        </div>
      )}

      {/* Document actuel */}
      {currentImageUrl && (
        <div className="relative w-full max-w-xs mx-auto">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            {allowedTypes.some(type => type.startsWith('image/')) ? (
              <Image
                src={currentImageUrl}
                alt="Document actuel"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <FileText className="w-8 h-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Document</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="w-3 h-3" />
          </ButtonV2>
        </div>
      )}

      {/* Zone d'upload */}
      {!currentImageUrl && (
        <div
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-gray-400",
            dragActive && "border-blue-500 bg-blue-50",
            error && "border-red-500 bg-red-50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {allowedTypes.some(type => type.startsWith('image/')) ? (
                  <Upload className="w-6 h-6 text-gray-400" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {allowedTypes.some(type => type.startsWith('image/'))
                    ? 'Cliquez ou glissez une image'
                    : 'Cliquez ou glissez un document'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {allowedTypes.map(t => t.split('/')[1]).join(', ')} (max {maxSizeMB}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Bouton pour remplacer l'image existante */}
      {currentImageUrl && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          {allowedTypes.some(type => type.startsWith('image/')) ? (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Remplacer l'image
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Remplacer le document
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
        </ButtonV2>
      )}
    </div>
  )
}