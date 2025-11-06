'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Bug, Camera, Send, X, AlertTriangle, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSupabaseMutation } from '@/shared/modules/common/hooks'
import { useUserActivityTracker } from '@/shared/modules/notifications/hooks'
import html2canvas from 'html2canvas'

interface BugReport {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'ui' | 'performance' | 'data' | 'feature' | 'other'
  steps_to_reproduce?: string
  expected_behavior?: string
  actual_behavior?: string
  browser_info: {
    user_agent: string
    viewport: { width: number; height: number }
    url: string
    timestamp: string
  }
  screenshot_url?: string
  console_errors?: string[]
}

interface BugReporterProps {
  trigger?: React.ReactNode
  onSubmitSuccess?: () => void
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800', icon: '🟢' },
  { value: 'medium', label: 'Moyenne', color: 'bg-gray-100 text-gray-900', icon: '🟡' },
  { value: 'high', label: 'Élevée', color: 'bg-gray-100 text-gray-900', icon: '🟠' },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-800', icon: '🔴' }
]

const CATEGORY_OPTIONS = [
  { value: 'ui', label: 'Interface utilisateur', icon: '🎨' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'data', label: 'Données', icon: '📊' },
  { value: 'feature', label: 'Fonctionnalité', icon: '⚙️' },
  { value: 'other', label: 'Autre', icon: '❓' }
]

export function BugReporter({ trigger, onSubmitSuccess }: BugReporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<BugReport>>({
    severity: 'medium',
    category: 'ui'
  })
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [takingScreenshot, setTakingScreenshot] = useState(false)
  const [consoleErrors, setConsoleErrors] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { trackEvent } = useUserActivityTracker()

  // Capture des erreurs console
  React.useEffect(() => {
    const errors: string[] = []
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.error = (...args) => {
      errors.push(`ERROR: ${args.join(' ')}`)
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      errors.push(`WARN: ${args.join(' ')}`)
      originalConsoleWarn.apply(console, args)
    }

    setConsoleErrors(errors)

    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [])

  // Mutation pour uploader screenshot
  const uploadScreenshotMutation = useSupabaseMutation<string>(
    async (supabase, { screenshot, filename }: { screenshot: string; filename: string }) => {
      // Convertir base64 en blob
      const response = await fetch(screenshot)
      const blob = await response.blob()

      const { data, error } = await supabase.storage
        .from('bug-reports')
        .upload(`screenshots/${filename}`, blob, {
          contentType: 'image/png',
          upsert: false
        })

      if (error) throw error

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('bug-reports')
        .getPublicUrl(data.path)

      return { data: urlData.publicUrl, error: null }
    }
  )

  // Mutation pour créer le bug report
  const createBugReportMutation = useSupabaseMutation<boolean>(
    async (supabase, bugReport: BugReport) => {
      const { error } = await supabase
        .from('bug_reports')
        .insert([{
          title: bugReport.title,
          description: bugReport.description,
          severity: bugReport.severity,
          category: bugReport.category,
          steps_to_reproduce: bugReport.steps_to_reproduce,
          expected_behavior: bugReport.expected_behavior,
          actual_behavior: bugReport.actual_behavior,
          browser_info: bugReport.browser_info,
          screenshot_url: bugReport.screenshot_url,
          console_errors: bugReport.console_errors,
          status: 'open',
          created_at: new Date().toISOString()
        }])

      return { data: !error, error }
    }
  )

  // Capture d'écran automatique
  const takeScreenshot = useCallback(async () => {
    setTakingScreenshot(true)

    try {
      // Masquer temporairement la modal de bug report
      const modal = document.querySelector('[data-bug-reporter-modal]')
      if (modal instanceof HTMLElement) {
        modal.style.display = 'none'
      }

      // Attendre un frame pour que le DOM se mette à jour
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Réduire la taille pour performance
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0
      })

      // Restaurer la modal
      if (modal instanceof HTMLElement) {
        modal.style.display = ''
      }

      const screenshotDataUrl = canvas.toDataURL('image/png', 0.8)
      setScreenshot(screenshotDataUrl)

      trackEvent({
        action: 'bug_report_screenshot_taken',
        new_data: {
          screenshot_size: screenshotDataUrl.length,
          viewport: { width: window.innerWidth, height: window.innerHeight }
        }
      })
    } catch (error) {
      console.error('Erreur capture d\'écran:', error)
      trackEvent({
        action: 'bug_report_screenshot_error',
        severity: 'error',
        new_data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setTakingScreenshot(false)
    }
  }, [trackEvent])

  // Soumission du rapport
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      return
    }

    let screenshotUrl: string | undefined

    try {
      // Upload screenshot si présent
      if (screenshot) {
        const filename = `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`
        screenshotUrl = await uploadScreenshotMutation.mutate({ screenshot, filename }) || undefined
      }

      // Créer le bug report
      const bugReport: BugReport = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity || 'medium',
        category: formData.category || 'ui',
        steps_to_reproduce: formData.steps_to_reproduce,
        expected_behavior: formData.expected_behavior,
        actual_behavior: formData.actual_behavior,
        browser_info: {
          user_agent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          url: window.location.href,
          timestamp: new Date().toISOString()
        },
        screenshot_url: screenshotUrl,
        console_errors: consoleErrors.slice(-10) // Dernières 10 erreurs
      }

      const success = await createBugReportMutation.mutate(bugReport)

      if (success) {
        trackEvent({
          action: 'bug_report_submitted',
          new_data: {
            severity: bugReport.severity,
            category: bugReport.category,
            has_screenshot: !!screenshotUrl
          }
        })

        setIsOpen(false)
        setFormData({ severity: 'medium', category: 'ui' })
        setScreenshot(null)
        onSubmitSuccess?.()
      }
    } catch (error) {
      console.error('Erreur soumission bug report:', error)
      trackEvent({
        action: 'bug_report_submission_error',
        severity: 'error',
        new_data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }, [formData, screenshot, consoleErrors, uploadScreenshotMutation, createBugReportMutation, trackEvent, onSubmitSuccess])

  const DefaultTrigger = (
    <ButtonV2
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 border-red-200 text-red-600 hover:bg-red-50"
    >
      <Bug className="h-4 w-4 mr-2" />
      Signaler un bug
    </ButtonV2>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || DefaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-bug-reporter-modal>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Signaler un bug
          </DialogTitle>
          <DialogDescription>
            Aidez-nous à améliorer Vérone en signalant les problèmes que vous rencontrez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre du problème *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Décrivez brièvement le problème"
              required
            />
          </div>

          {/* Sévérité et Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sévérité</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez en détail le problème rencontré"
              rows={4}
              required
            />
          </div>

          {/* Étapes pour reproduire */}
          <div className="space-y-2">
            <Label htmlFor="steps">Étapes pour reproduire</Label>
            <Textarea
              id="steps"
              value={formData.steps_to_reproduce || ''}
              onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
              placeholder="1. Aller sur la page...&#10;2. Cliquer sur...&#10;3. Observer que..."
              rows={3}
            />
          </div>

          {/* Comportement attendu vs actuel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected">Comportement attendu</Label>
              <Textarea
                id="expected"
                value={formData.expected_behavior || ''}
                onChange={(e) => setFormData({ ...formData, expected_behavior: e.target.value })}
                placeholder="Ce qui devrait se passer"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual">Comportement actuel</Label>
              <Textarea
                id="actual"
                value={formData.actual_behavior || ''}
                onChange={(e) => setFormData({ ...formData, actual_behavior: e.target.value })}
                placeholder="Ce qui se passe réellement"
                rows={2}
              />
            </div>
          </div>

          {/* Capture d'écran */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Capture d'écran
              </CardTitle>
              <CardDescription>
                Une capture d'écran nous aide à mieux comprendre le problème
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!screenshot ? (
                <ButtonV2
                  type="button"
                  variant="outline"
                  onClick={takeScreenshot}
                  disabled={takingScreenshot}
                  className="w-full"
                >
                  {takingScreenshot ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Capture en cours...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Prendre une capture d'écran
                    </>
                  )}
                </ButtonV2>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Capture d'écran ajoutée</span>
                    </div>
                    <ButtonV2
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenshot(null)}
                    >
                      <X className="h-4 w-4" />
                    </ButtonV2>
                  </div>
                  <img
                    src={screenshot}
                    alt="Capture d'écran"
                    className="max-w-full h-32 object-cover border rounded"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Erreurs console */}
          {consoleErrors.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{consoleErrors.length} erreur(s) détectée(s)</strong> dans la console.
                Elles seront automatiquement incluses dans le rapport.
              </AlertDescription>
            </Alert>
          )}

          {/* Info système */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-gray-600">
              <div>Page: {window.location.pathname}</div>
              <div>Navigateur: {navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
              <div>Résolution: {window.innerWidth}x{window.innerHeight}</div>
              <div>Timestamp: {new Date().toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={
                !formData.title ||
                !formData.description ||
                createBugReportMutation.loading ||
                uploadScreenshotMutation.loading
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {createBugReportMutation.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le rapport
                </>
              )}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}