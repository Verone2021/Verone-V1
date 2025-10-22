"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ButtonV2 } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Bug,
  Camera,
  Code,
  FileText,
  Image,
  Monitor,
  Send,
  Trash2,
  Upload,
  User,
  X,
  Zap,
  Info,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ErrorType = 'console_error' | 'ui_bug' | 'performance' | 'functionality' | 'accessibility' | 'design'
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface ErrorReport {
  id?: string
  testId: string
  title: string
  description: string
  errorType: ErrorType
  severity: ErrorSeverity
  status: ReportStatus
  screenshots: File[]
  codeSnippet?: string
  browserInfo?: BrowserInfo
  steps?: string[]
  expectedBehavior?: string
  actualBehavior?: string
  assignedTo?: string
  createdAt: Date
  updatedAt?: Date
}

interface BrowserInfo {
  userAgent: string
  url: string
  viewport: string
  timestamp: string
}

interface ErrorReportModalProps {
  testId: string
  testTitle: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (report: ErrorReport) => Promise<void>
  existingReport?: ErrorReport
  children?: React.ReactNode
}

// Configuration des types d'erreurs
const ERROR_TYPE_CONFIG = {
  console_error: {
    label: 'Erreur Console',
    icon: Code,
    description: 'Erreurs JavaScript dans la console',
    color: 'text-red-600'
  },
  ui_bug: {
    label: 'Bug Interface',
    icon: Monitor,
    description: 'Problème d\'affichage ou d\'interaction',
    color: 'text-black'
  },
  performance: {
    label: 'Performance',
    icon: Zap,
    description: 'Lenteur ou problème de performance',
    color: 'text-gray-700'
  },
  functionality: {
    label: 'Fonctionnalité',
    icon: Bug,
    description: 'Fonctionnalité qui ne marche pas',
    color: 'text-blue-600'
  },
  accessibility: {
    label: 'Accessibilité',
    icon: User,
    description: 'Problème d\'accessibilité (A11y)',
    color: 'text-purple-600'
  },
  design: {
    label: 'Design System',
    icon: FileText,
    description: 'Non-respect du Design System Vérone',
    color: 'text-pink-600'
  }
} as const

// Configuration de sévérité
const SEVERITY_CONFIG = {
  low: {
    label: 'Faible',
    color: 'bg-gray-200 text-gray-800',
    description: 'Problème mineur, peut attendre'
  },
  medium: {
    label: 'Moyenne',
    color: 'bg-gray-400 text-white',
    description: 'Problème notable, à corriger'
  },
  high: {
    label: 'Élevée',
    color: 'bg-gray-600 text-white',
    description: 'Problème important, prioritaire'
  },
  critical: {
    label: 'Critique',
    color: 'bg-red-600 text-white', // ✅ Rouge au lieu de noir pour critique
    description: 'Problème bloquant, urgent'
  }
} as const

// Hook pour la détection automatique du navigateur
const useBrowserInfo = (): BrowserInfo => {
  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString()
  }
}

export function ErrorReportModal({
  testId,
  testTitle,
  isOpen,
  onClose,
  onSubmit,
  existingReport,
  children
}: ErrorReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTab, setCurrentTab] = useState('details')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const browserInfo = useBrowserInfo()

  // État du formulaire
  const [formData, setFormData] = useState<Partial<ErrorReport>>({
    testId,
    title: existingReport?.title || '',
    description: existingReport?.description || '',
    errorType: existingReport?.errorType || 'ui_bug',
    severity: existingReport?.severity || 'medium',
    status: existingReport?.status || 'open',
    screenshots: existingReport?.screenshots || [],
    codeSnippet: existingReport?.codeSnippet || '',
    steps: existingReport?.steps || [],
    expectedBehavior: existingReport?.expectedBehavior || '',
    actualBehavior: existingReport?.actualBehavior || '',
    browserInfo,
    createdAt: existingReport?.createdAt || new Date()
  })

  // Gestion de l'upload de screenshots
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB max
      return isImage && isValidSize
    })

    setFormData(prev => ({
      ...prev,
      screenshots: [...(prev.screenshots || []), ...newFiles]
    }))
  }

  // Supprimer un screenshot
  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots?.filter((_, i) => i !== index) || []
    }))
  }

  // Ajouter une étape de reproduction
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), '']
    }))
  }

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.map((step, i) => i === index ? value : step) || []
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || []
    }))
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) return

    setIsSubmitting(true)

    try {
      const report: ErrorReport = {
        ...formData,
        id: existingReport?.id || `error_${Date.now()}`,
        updatedAt: new Date()
      } as ErrorReport

      await onSubmit(report)
      onClose()
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Capture automatique de screenshot
  const captureScreenshot = async () => {
    try {
      // Utilisation de l'API Screen Capture si disponible
      if ('getDisplayMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' }
        })

        const video = document.createElement('video')
        video.srcObject = stream
        video.play()

        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)

          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `screenshot-${Date.now()}.png`, {
                type: 'image/png'
              })
              setFormData(prev => ({
                ...prev,
                screenshots: [...(prev.screenshots || []), file]
              }))
            }
          })

          stream.getTracks().forEach(track => track.stop())
        })
      }
    } catch (error) {
      console.log('Screenshot capture not available:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-black" />
            Rapport d'Erreur - {testTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="h-full">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="media">Captures</TabsTrigger>
              <TabsTrigger value="technical">Technique</TabsTrigger>
              <TabsTrigger value="workflow">Reproduction</TabsTrigger>
            </TabsList>

            {/* Onglet Détails */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du problème *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Bouton 'Valider' ne répond pas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="errorType">Type d'erreur</Label>
                  <Select
                    value={formData.errorType}
                    onValueChange={(value: ErrorType) =>
                      setFormData(prev => ({ ...prev, errorType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ERROR_TYPE_CONFIG).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-gray-600">{config.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Sévérité</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: ErrorSeverity) =>
                      setFormData(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", config.color)}>
                              {config.label}
                            </Badge>
                            <span className="text-sm">{config.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ReportStatus) =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                          Ouvert
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-gray-500 rounded-full" />
                          En cours
                        </div>
                      </SelectItem>
                      <SelectItem value="resolved">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                          Résolu
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-gray-500 rounded-full" />
                          Fermé
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le problème en détail..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected">Comportement attendu</Label>
                  <Textarea
                    id="expected"
                    value={formData.expectedBehavior}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                    placeholder="Ce qui devrait se passer..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual">Comportement observé</Label>
                  <Textarea
                    id="actual"
                    value={formData.actualBehavior}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualBehavior: e.target.value }))}
                    placeholder="Ce qui se passe réellement..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Captures */}
            <TabsContent value="media" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Screenshots et captures</Label>
                  <div className="flex gap-2">
                    <ButtonV2
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureScreenshot}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture écran
                    </ButtonV2>
                    <ButtonV2
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload fichier
                    </ButtonV2>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />

                {/* Zone de drag & drop */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileUpload(e.dataTransfer.files)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Glissez-déposez vos images ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF jusqu'à 10MB
                  </p>
                </div>

                {/* Aperçu des screenshots */}
                {formData.screenshots && formData.screenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.screenshots.map((file, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <ButtonV2
                            type="button"
                            variant="danger"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeScreenshot(index)}
                          >
                            <X className="h-3 w-3" />
                          </ButtonV2>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {file.name}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Technique */}
            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codeSnippet">Code d'erreur / Console</Label>
                  <Textarea
                    id="codeSnippet"
                    value={formData.codeSnippet}
                    onChange={(e) => setFormData(prev => ({ ...prev, codeSnippet: e.target.value }))}
                    placeholder="Coller le code d'erreur de la console JavaScript..."
                    className="font-mono text-sm min-h-[120px]"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Informations du navigateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-600">User Agent</Label>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {browserInfo.userAgent}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">URL</Label>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {browserInfo.url}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Résolution</Label>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                          {browserInfo.viewport}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Timestamp</Label>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                          {new Date(browserInfo.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Reproduction */}
            <TabsContent value="workflow" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Étapes de reproduction</Label>
                  <ButtonV2
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                  >
                    Ajouter étape
                  </ButtonV2>
                </div>

                {formData.steps && formData.steps.length > 0 ? (
                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-2">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <Textarea
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            placeholder={`Étape ${index + 1}: Décrire l'action...`}
                            className="min-h-[60px]"
                          />
                        </div>
                        <ButtonV2
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ButtonV2>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucune étape de reproduction ajoutée</p>
                    <p className="text-sm">Cliquez sur "Ajouter étape" pour commencer</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer avec boutons d'action */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4" />
              Test ID: {testId}
            </div>

            <div className="flex gap-2">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>

              <ButtonV2
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.description}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {existingReport ? 'Mettre à jour' : 'Créer le rapport'}
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Bouton rapide pour ouvrir le modal
interface QuickErrorReportProps {
  testId: string
  testTitle: string
  onSubmit: (report: ErrorReport) => Promise<void>
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QuickErrorReport({
  testId,
  testTitle,
  onSubmit,
  variant = 'button',
  size = 'sm',
  className
}: QuickErrorReportProps) {
  const [isOpen, setIsOpen] = useState(false)

  const trigger = variant === 'icon' ? (
    <ButtonV2
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0", className)}
      title="Signaler une erreur"
    >
      <AlertTriangle className="h-4 w-4 text-black" />
    </ButtonV2>
  ) : (
    <ButtonV2
      variant="outline"
      size={size}
      className={cn("text-black border-gray-300 hover:bg-gray-50", className)}
    >
      <AlertTriangle className="mr-2 h-4 w-4" />
      Signaler erreur
    </ButtonV2>
  )

  return (
    <ErrorReportModal
      testId={testId}
      testTitle={testTitle}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={onSubmit}
    >
      {trigger}
    </ErrorReportModal>
  )
}