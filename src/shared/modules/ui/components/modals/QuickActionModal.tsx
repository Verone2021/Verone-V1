"use client"

import { useState } from 'react'
import { X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type ActionType = 'create' | 'update' | 'delete' | 'confirm' | 'custom'

export interface QuickActionField {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'email' | 'password'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: string | number
  validation?: (value: any) => string | null
}

export interface QuickActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  actionType: ActionType
  fields?: QuickActionField[]
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  loading?: boolean
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  children?: React.ReactNode
}

export function QuickActionModal({
  isOpen,
  onClose,
  title,
  description,
  actionType,
  fields = [],
  confirmText,
  cancelText = 'Annuler',
  destructive = false,
  loading = false,
  onSubmit,
  children
}: QuickActionModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialiser les valeurs par défaut
  useState(() => {
    const defaultData: Record<string, any> = {}
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultData[field.name] = field.defaultValue
      }
    })
    setFormData(defaultData)
  })

  const getActionConfig = () => {
    switch (actionType) {
      case 'create':
        return {
          confirmText: confirmText || 'Créer',
          variant: 'secondary' as const,
          icon: null
        }
      case 'update':
        return {
          confirmText: confirmText || 'Mettre à jour',
          variant: 'secondary' as const,
          icon: null
        }
      case 'delete':
        return {
          confirmText: confirmText || 'Supprimer',
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />
        }
      case 'confirm':
        return {
          confirmText: confirmText || 'Confirmer',
          variant: 'secondary' as const,
          icon: <CheckCircle className="h-4 w-4" />
        }
      default:
        return {
          confirmText: confirmText || 'Valider',
          variant: 'secondary' as const,
          icon: null
        }
    }
  }

  const config = getActionConfig()

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))

    // Effacer l'erreur si elle existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    fields.forEach(field => {
      const value = formData[field.name]

      // Validation des champs requis
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} est requis`
        return
      }

      // Validation personnalisée
      if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
        }
      }

      // Validation du type email
      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        newErrors[field.name] = 'Email invalide'
      }

      // Validation des nombres
      if (field.type === 'number' && value && isNaN(Number(value))) {
        newErrors[field.name] = 'Doit être un nombre valide'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: QuickActionField) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(field.name, val)}
            >
              <SelectTrigger className={cn('border-black', error && 'border-red-500')}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={cn('border-black resize-none', error && 'border-red-500')}
              rows={3}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={cn('border-black', error && 'border-red-500')}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-black">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {config.icon}
                <span>{title}</span>
                {destructive && (
                  <Badge variant="outline" className="border-red-300 text-red-600">
                    Attention
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="mt-2">
                  {description}
                </CardDescription>
              )}
            </div>
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting || loading}
            >
              <X className="h-4 w-4" />
            </ButtonV2>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champs personnalisés */}
            {fields.map(renderField)}

            {/* Contenu personnalisé */}
            {children}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || loading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                {cancelText}
              </ButtonV2>

              <ButtonV2
                type="submit"
                variant={destructive ? 'destructive' : 'secondary'}
                disabled={isSubmitting || loading}
                className={destructive ? '' : 'bg-black hover:bg-gray-800 text-white'}
              >
                {(isSubmitting || loading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {config.confirmText}
              </ButtonV2>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Hooks et fonctions utilitaires pour faciliter l'utilisation

export function useQuickActionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<Partial<QuickActionModalProps>>({})

  const openModal = (modalConfig: Partial<QuickActionModalProps>) => {
    setConfig(modalConfig)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setConfig({})
  }

  const Modal = ({ children, ...props }: Partial<QuickActionModalProps> & { children?: React.ReactNode }) => (
    <QuickActionModal
      {...config}
      {...(props as any)}
      isOpen={isOpen}
      onClose={closeModal}
    >
      {children}
    </QuickActionModal>
  )

  return {
    openModal,
    closeModal,
    Modal,
    isOpen
  }
}

// Modals préconfigurés pour des actions communes
export const StockAdjustmentModal = (props: Omit<QuickActionModalProps, 'fields' | 'title' | 'actionType'>) => (
  <QuickActionModal
    {...props}
    title="Ajuster Stock"
    actionType="update"
    fields={[
      {
        name: 'quantity',
        label: 'Nouvelle quantité',
        type: 'number',
        required: true,
        validation: (value) => value < 0 ? 'La quantité ne peut pas être négative' : null
      },
      {
        name: 'reason',
        label: 'Motif',
        type: 'select',
        required: true,
        options: [
          { value: 'inventory_found', label: 'Inventaire trouvaille' },
          { value: 'damaged', label: 'Produit endommagé' },
          { value: 'correction', label: 'Correction' },
          { value: 'other', label: 'Autre' }
        ]
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Détails de l\'ajustement...'
      }
    ]}
  />
)

export const QuickOrderModal = (props: Omit<QuickActionModalProps, 'fields' | 'title' | 'actionType'>) => (
  <QuickActionModal
    {...props}
    title="Commande Rapide"
    actionType="create"
    fields={[
      {
        name: 'supplier_id',
        label: 'Fournisseur',
        type: 'select',
        required: true,
        options: [] // À peupler dynamiquement
      },
      {
        name: 'quantity',
        label: 'Quantité',
        type: 'number',
        required: true,
        validation: (value) => value <= 0 ? 'La quantité doit être positive' : null
      },
      {
        name: 'unit_price',
        label: 'Prix unitaire',
        type: 'number',
        placeholder: '0.00'
      },
      {
        name: 'notes',
        label: 'Notes commande',
        type: 'textarea',
        placeholder: 'Informations supplémentaires...'
      }
    ]}
  />
)