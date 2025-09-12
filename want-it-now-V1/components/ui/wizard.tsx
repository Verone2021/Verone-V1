"use client"

import { useState, ReactNode, useCallback } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader } from './card'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<WizardStepProps>
  optional?: boolean
  validation?: () => boolean | Promise<boolean>
}

export interface WizardStepProps {
  onNext: () => void
  onPrev: () => void
  onComplete: () => void
  currentStep: number
  totalSteps: number
  isFirst: boolean
  isLast: boolean
  data: Record<string, any>
  setData: (key: string, value: any) => void
}

export interface WizardProps {
  steps: WizardStep[]
  title: string
  subtitle?: string
  onComplete: (data: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  className?: string
  data?: Record<string, any>
  showProgressBar?: boolean
  allowSkipOptional?: boolean
}

export function Wizard({
  steps,
  title,
  subtitle,
  onComplete,
  onCancel,
  className,
  data: initialData = {},
  showProgressBar = true,
  allowSkipOptional = true
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<Record<string, any>>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const updateData = useCallback((key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }, [])

  const validateCurrentStep = async (): Promise<boolean> => {
    const step = steps[currentStep]
    if (step.validation) {
      return await step.validation()
    }
    return true
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      await handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error('Wizard completion error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to previous steps or completed steps
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const currentStepData = steps[currentStep]
  const CurrentStepComponent = currentStepData?.component

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex < currentStep) return 'accessible'
    return 'pending'
  }

  const StepIcon = ({ stepIndex, status }: { stepIndex: number; status: string }) => {
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    return <span className="font-bold text-sm">{stepIndex + 1}</span>
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-gray-50 to-gray-100', className)}>
      {/* Full Width Container */}
      <div className="flex flex-col min-h-screen">
        
        {/* Header - Full Width with Gradient */}
        <div className="gradient-copper text-white shadow-modern-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {subtitle && (
                  <p className="text-copper-100 opacity-90 text-lg">{subtitle}</p>
                )}
                <div className="flex items-center space-x-2 mt-3">
                  <div className="text-copper-100 opacity-75 text-sm">
                    Étape {currentStep + 1} sur {steps.length}
                  </div>
                  <div className="flex-1 bg-copper-600/30 rounded-full h-2 max-w-48">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-white hover:bg-white/20 border border-white/20"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Modern Stepper - Full Width */}
        {showProgressBar && (
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
                  <div 
                    className="h-full bg-brand-copper transition-all duration-500"
                    style={{ width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%` }}
                  />
                </div>
                
                {/* Steps */}
                <div className="relative flex justify-between z-10">
                  {steps.map((step, index) => {
                    const status = getStepStatus(index)
                    const isClickable = status === 'accessible' || status === 'completed' || status === 'current'

                    return (
                      <div key={step.id} className="flex flex-col items-center group">
                        {/* Step Circle */}
                        <button
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-modern border-4',
                            {
                              'bg-brand-copper border-brand-copper text-white scale-110': status === 'current',
                              'bg-brand-copper border-brand-copper text-white': status === 'completed',
                              'bg-white border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white hover:scale-105': isClickable && status === 'accessible',
                              'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': status === 'pending'
                            }
                          )}
                          onClick={() => isClickable && handleStepClick(index)}
                          disabled={!isClickable}
                        >
                          <StepIcon stepIndex={index} status={status} />
                        </button>

                        {/* Step Info */}
                        <div className="mt-3 text-center max-w-32">
                          <div className={cn(
                            'text-sm font-semibold truncate transition-colors',
                            {
                              'text-brand-copper': status === 'current',
                              'text-gray-900': status === 'completed',
                              'text-gray-600 group-hover:text-brand-copper': status === 'accessible',
                              'text-gray-400': status === 'pending'
                            }
                          )}>
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {step.description}
                          </div>
                          {step.optional && allowSkipOptional && (
                            <div className="text-xs text-amber-600 mt-1 font-medium">Optionnel</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Expandable */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl modern-shadow overflow-hidden">
              <div className="p-8 lg:p-12 min-h-96">
                {CurrentStepComponent && (
                  <CurrentStepComponent
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onComplete={handleComplete}
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    isFirst={currentStep === 0}
                    isLast={currentStep === steps.length - 1}
                    data={data}
                    setData={updateData}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer - Full Width */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-modern-lg z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Précédent
                </Button>

                {/* Step Indicator in Footer */}
                <div className="hidden sm:flex items-center text-sm text-gray-500">
                  <span className="font-medium text-brand-copper">{currentStep + 1}</span>
                  <span className="mx-2">/</span>
                  <span>{steps.length}</span>
                  <span className="ml-2">•</span>
                  <span className="ml-2">{currentStepData?.title}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Skip Optional */}
                {currentStepData?.optional && allowSkipOptional && currentStep < steps.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Ignorer cette étape
                  </Button>
                )}

                {/* Save Draft */}
                <Button
                  variant="outline"
                  onClick={() => console.log('Draft saved:', data)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Brouillon
                </Button>

                {/* Next/Complete Button */}
                <Button
                  variant="primaryCopper"
                  onClick={handleNext}
                  loading={isLoading}
                  className="min-w-32"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Terminer
                    </>
                  ) : (
                    <>
                      Suivant
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// Example Step Components
export function ExampleStep1({ onNext, data, setData }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Informations de base</h3>
        <p className="text-gray-600">Commençons par les informations de base du propriétaire.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Nom complet *
          </label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => setData('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            placeholder="Entrez le nom complet"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Type de propriétaire *
          </label>
          <select
            value={data.type || ''}
            onChange={(e) => setData('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
          >
            <option value="">Sélectionner un type</option>
            <option value="individual">Particulier</option>
            <option value="company">Entreprise</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!data.name || !data.type}>
          Continuer
        </Button>
      </div>
    </div>
  )
}

// Example Wizard Usage
export function ExampleWizard() {
  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Informations',
      description: 'Données de base',
      component: ExampleStep1,
      validation: async () => {
        // Add validation logic here
        return true
      }
    },
    // Add more steps as needed
  ]

  const handleComplete = async (data: Record<string, any>) => {
    console.log('Wizard completed with data:', data)
    // Handle completion logic
  }

  return (
    <Wizard
      steps={steps}
      title="Nouveau Propriétaire"
      subtitle="Créer un propriétaire en quelques étapes"
      onComplete={handleComplete}
      onCancel={() => console.log('Wizard cancelled')}
    />
  )
}

export default Wizard