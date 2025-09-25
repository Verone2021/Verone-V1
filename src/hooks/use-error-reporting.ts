"use client"

import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

// Types pour le système de reporting d'erreurs
export type ErrorType = 'console_error' | 'ui_bug' | 'performance' | 'functionality' | 'accessibility' | 'design'
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface ErrorReport {
  id?: string
  testId: string
  testTitle: string
  title: string
  description: string
  errorType: ErrorType
  severity: ErrorSeverity
  status: ReportStatus
  screenshots: File[]
  screenshotUrls?: string[]
  codeSnippet?: string
  browserInfo: BrowserInfo
  steps: string[]
  expectedBehavior?: string
  actualBehavior?: string
  assignedTo?: string
  reportedBy?: string
  createdAt: Date
  updatedAt?: Date
  resolvedAt?: Date
  tags?: string[]
}

export interface BrowserInfo {
  userAgent: string
  url: string
  viewport: string
  timestamp: string
  consoleErrors: string[]
  performanceMetrics?: PerformanceMetrics
}

export interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
}

interface UseErrorReportingOptions {
  enableAutoErrorDetection?: boolean
  enablePerformanceTracking?: boolean
  maxScreenshotSize?: number // en bytes
  maxScreenshots?: number
  autoUploadScreenshots?: boolean
}

// Hook principal pour la gestion des rapports d'erreurs
export function useErrorReporting(options: UseErrorReportingOptions = {}) {
  const {
    enableAutoErrorDetection = true,
    enablePerformanceTracking = true,
    maxScreenshotSize = 5 * 1024 * 1024, // 5MB
    maxScreenshots = 5,
    autoUploadScreenshots = true
  } = options

  // États du hook
  const [reports, setReports] = useState<ErrorReport[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [consoleErrors, setConsoleErrors] = useState<string[]>([])

  // Refs pour les listeners
  const originalConsoleError = useRef<typeof console.error>()
  const performanceObserver = useRef<PerformanceObserver>()

  const supabase = createClient()

  // Auto-détection des erreurs console
  const initializeErrorDetection = useCallback(() => {
    if (!enableAutoErrorDetection) return

    // Intercepter console.error
    if (!originalConsoleError.current) {
      originalConsoleError.current = console.error

      console.error = (...args: any[]) => {
        const errorMessage = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ')

        setConsoleErrors(prev => {
          const newErrors = [
            `[${new Date().toISOString()}] ${errorMessage}`,
            ...prev
          ].slice(0, 50) // Garder max 50 erreurs

          return newErrors
        })

        // Appeler la fonction originale
        originalConsoleError.current?.(...args)
      }
    }

    // Écouter les erreurs window
    const handleWindowError = (event: ErrorEvent) => {
      const errorInfo = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
      setConsoleErrors(prev => [
        `[${new Date().toISOString()}] ${errorInfo}`,
        ...prev
      ].slice(0, 50))
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo = `Unhandled Promise Rejection: ${event.reason}`
      setConsoleErrors(prev => [
        `[${new Date().toISOString()}] ${errorInfo}`,
        ...prev
      ].slice(0, 50))
    }

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)

      // Restaurer console.error original
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current
      }
    }
  }, [enableAutoErrorDetection])

  // Collecte des métriques de performance
  const getPerformanceMetrics = useCallback((): PerformanceMetrics | undefined => {
    if (!enablePerformanceTracking || !window.performance) return undefined

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')
    const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint')[0]

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
      largestContentfulPaint: largestContentfulPaint ? largestContentfulPaint.startTime : 0,
      cumulativeLayoutShift: 0 // À implémenter avec Layout Shift API
    }
  }, [enablePerformanceTracking])

  // Collecte des informations navigateur
  const getBrowserInfo = useCallback((): BrowserInfo => {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      consoleErrors: consoleErrors.slice(0, 10), // Dernières 10 erreurs
      performanceMetrics: getPerformanceMetrics()
    }
  }, [consoleErrors, getPerformanceMetrics])

  // Upload d'un screenshot vers Supabase Storage
  const uploadScreenshot = useCallback(async (file: File, reportId: string): Promise<string | null> => {
    try {
      // Vérifier la taille du fichier
      if (file.size > maxScreenshotSize) {
        throw new Error(`Screenshot trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB > ${Math.round(maxScreenshotSize / 1024 / 1024)}MB`)
      }

      const fileName = `${reportId}/${Date.now()}-${file.name}`
      const uploadKey = `${reportId}-${file.name}`

      // Suivre le progrès d'upload
      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }))

      const { data, error } = await supabase.storage
        .from('test-screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }))

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('test-screenshots')
        .getPublicUrl(fileName)

      return publicUrl

    } catch (error) {
      console.error('Error uploading screenshot:', error)
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[`${reportId}-${file.name}`]
        return newProgress
      })
      return null
    }
  }, [supabase, maxScreenshotSize])

  // Soumettre un rapport d'erreur
  const submitReport = useCallback(async (report: Omit<ErrorReport, 'id' | 'browserInfo' | 'createdAt' | 'reportedBy'>): Promise<string | null> => {
    setIsSubmitting(true)

    try {
      // Générer un ID unique
      const reportId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Collecter les informations du navigateur
      const browserInfo = getBrowserInfo()

      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      const reportedBy = user?.id || 'anonymous'

      // Uploader les screenshots
      let screenshotUrls: string[] = []
      if (autoUploadScreenshots && report.screenshots.length > 0) {
        const uploadPromises = report.screenshots
          .slice(0, maxScreenshots)
          .map(file => uploadScreenshot(file, reportId))

        const results = await Promise.allSettled(uploadPromises)
        screenshotUrls = results
          .map(result => result.status === 'fulfilled' ? result.value : null)
          .filter((url): url is string => url !== null)
      }

      // Créer le rapport complet
      const completeReport: ErrorReport = {
        ...report,
        id: reportId,
        browserInfo,
        reportedBy,
        screenshotUrls,
        createdAt: new Date()
      }

      // Sauvegarder dans Supabase
      const { error: insertError } = await supabase
        .from('test_error_reports')
        .insert({
          id: reportId,
          test_id: report.testId,
          test_title: report.testTitle,
          title: report.title,
          description: report.description,
          error_type: report.errorType,
          severity: report.severity,
          status: report.status,
          screenshot_urls: screenshotUrls,
          code_snippet: report.codeSnippet,
          browser_info: browserInfo,
          reproduction_steps: report.steps,
          expected_behavior: report.expectedBehavior,
          actual_behavior: report.actualBehavior,
          assigned_to: report.assignedTo,
          reported_by: reportedBy,
          created_at: completeReport.createdAt.toISOString(),
          tags: report.tags
        })

      if (insertError) throw insertError

      // Ajouter à la liste locale
      setReports(prev => [completeReport, ...prev])

      return reportId

    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase, getBrowserInfo, autoUploadScreenshots, maxScreenshots, uploadScreenshot])

  // Charger les rapports existants
  const loadReports = useCallback(async (testId?: string): Promise<ErrorReport[]> => {
    try {
      let query = supabase
        .from('test_error_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (testId) {
        query = query.eq('test_id', testId)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      const formattedReports: ErrorReport[] = (data || []).map(report => ({
        id: report.id,
        testId: report.test_id,
        testTitle: report.test_title,
        title: report.title,
        description: report.description,
        errorType: report.error_type,
        severity: report.severity,
        status: report.status,
        screenshots: [], // Les fichiers originaux ne sont pas disponibles
        screenshotUrls: report.screenshot_urls || [],
        codeSnippet: report.code_snippet,
        browserInfo: report.browser_info,
        steps: report.reproduction_steps || [],
        expectedBehavior: report.expected_behavior,
        actualBehavior: report.actual_behavior,
        assignedTo: report.assigned_to,
        reportedBy: report.reported_by,
        createdAt: new Date(report.created_at),
        updatedAt: report.updated_at ? new Date(report.updated_at) : undefined,
        resolvedAt: report.resolved_at ? new Date(report.resolved_at) : undefined,
        tags: report.tags || []
      }))

      setReports(formattedReports)
      return formattedReports

    } catch (error) {
      console.error('Error loading reports:', error)
      return []
    }
  }, [supabase])

  // Mettre à jour un rapport existant
  const updateReport = useCallback(async (reportId: string, updates: Partial<ErrorReport>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('test_error_reports')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          resolved_at: updates.status === 'resolved' ? new Date().toISOString() : undefined
        })
        .eq('id', reportId)

      if (error) throw error

      // Mettre à jour la liste locale
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, ...updates, updatedAt: new Date() } : report
      ))

      return true
    } catch (error) {
      console.error('Error updating report:', error)
      return false
    }
  }, [supabase])

  // Capture automatique de screenshot de la page courante
  const captureCurrentPage = useCallback(async (): Promise<File | null> => {
    try {
      // Utiliser l'API Screen Capture si disponible
      if ('getDisplayMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' as any }
        })

        return new Promise((resolve) => {
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
              stream.getTracks().forEach(track => track.stop())

              if (blob) {
                const file = new File([blob], `screenshot-${Date.now()}.png`, {
                  type: 'image/png'
                })
                resolve(file)
              } else {
                resolve(null)
              }
            }, 'image/png', 0.8)
          })
        })
      }

      return null
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      return null
    }
  }, [])

  // Créer un rapport rapide pour un test spécifique
  const quickReport = useCallback(async (
    testId: string,
    testTitle: string,
    errorType: ErrorType = 'ui_bug',
    autoCapture: boolean = true
  ): Promise<Partial<ErrorReport>> => {
    const screenshots: File[] = []

    // Capture automatique si demandée
    if (autoCapture) {
      const screenshot = await captureCurrentPage()
      if (screenshot) {
        screenshots.push(screenshot)
      }
    }

    return {
      testId,
      testTitle,
      errorType,
      severity: 'medium',
      status: 'open',
      screenshots,
      steps: [],
      title: `Erreur détectée sur ${testTitle}`,
      description: `Erreur automatiquement détectée lors de l'exécution du test "${testTitle}".`
    }
  }, [captureCurrentPage])

  // Obtenir les statistiques des rapports
  const getReportStats = useCallback(() => {
    const total = reports.length
    const byStatus = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1
      return acc
    }, {} as Record<ReportStatus, number>)

    const bySeverity = reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1
      return acc
    }, {} as Record<ErrorSeverity, number>)

    const byType = reports.reduce((acc, report) => {
      acc[report.errorType] = (acc[report.errorType] || 0) + 1
      return acc
    }, {} as Record<ErrorType, number>)

    return {
      total,
      byStatus,
      bySeverity,
      byType,
      resolved: byStatus.resolved || 0,
      open: byStatus.open || 0,
      critical: bySeverity.critical || 0
    }
  }, [reports])

  return {
    // États
    reports,
    isSubmitting,
    uploadProgress,
    consoleErrors,

    // Actions principales
    submitReport,
    updateReport,
    loadReports,
    quickReport,

    // Utilitaires
    captureCurrentPage,
    getBrowserInfo,
    getReportStats,
    initializeErrorDetection,

    // Méthodes de convenance
    clearConsoleErrors: () => setConsoleErrors([]),
    getReportById: (id: string) => reports.find(r => r.id === id),
    getReportsByTest: (testId: string) => reports.filter(r => r.testId === testId),
    getReportsByStatus: (status: ReportStatus) => reports.filter(r => r.status === status)
  }
}