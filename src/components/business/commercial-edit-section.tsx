"use client"

import { useState } from 'react'
import { CreditCard, Save, X, Edit, Clock, DollarSign, Package } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn, formatPrice } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Organisation {
  id: string
  payment_terms?: string | null
  delivery_time_days?: number | null
  minimum_order_amount?: number | null
  currency?: string | null
  prepayment_required?: boolean | null
}

interface CommercialEditSectionProps {
  organisation: Organisation
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void
  className?: string
}

export function CommercialEditSection({ organisation, onUpdate, className }: CommercialEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges
  } = useInlineEdit({
    organisationId: organisation.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour conditions commerciales:', error)
    }
  })

  const section: EditableSection = 'commercial'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      payment_terms: organisation.payment_terms || '',
      delivery_time_days: organisation.delivery_time_days || 0,
      minimum_order_amount: organisation.minimum_order_amount || 0,
      currency: organisation.currency || 'EUR',
      prepayment_required: organisation.prepayment_required || false
    })
  }

  const handleSave = async () => {
    // Validation business rules
    if (editData?.delivery_time_days && editData.delivery_time_days < 0) {
      alert('⚠️ Le délai de livraison ne peut pas être négatif')
      return
    }

    if (editData?.minimum_order_amount && editData.minimum_order_amount < 0) {
      alert('⚠️ Le montant minimum de commande ne peut pas être négatif')
      return
    }

    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Conditions commerciales mises à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    let processedValue: any = value

    if (field === 'delivery_time_days') {
      processedValue = parseInt(value.toString()) || 0
    }

    if (field === 'minimum_order_amount') {
      processedValue = parseFloat(value.toString()) || 0
    }

    updateEditedData(section, { [field]: processedValue || null })
  }

  // Options de devises
  const currencies = [
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'USD', name: 'Dollar US ($)', symbol: '$' },
    { code: 'GBP', name: 'Livre Sterling (£)', symbol: '£' },
    { code: 'CHF', name: 'Franc Suisse (CHF)', symbol: 'CHF' }
  ]

  // Options de conditions de paiement - Standard CRM/ERP
  const paymentTermsOptions = [
    { value: '0', label: 'Paiement immédiat (0 jours)', days: 0 },
    { value: '30', label: '30 jours net', days: 30 },
    { value: '60', label: '60 jours net', days: 60 },
    { value: '90', label: '90 jours net', days: 90 }
  ]

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-black flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Conditions Commerciales
          </h3>
          <div className="flex space-x-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-5">
          {/* Conditions de paiement */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Conditions de paiement
            </label>
            <select
              value={editData?.payment_terms || ''}
              onChange={(e) => handleFieldChange('payment_terms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">Sélectionner...</option>
              {paymentTermsOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Modalités et délais de paiement négociés avec le fournisseur
            </div>
          </div>

          {/* Système de prépaiement */}
          {editData?.payment_terms === '0' && (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="prepayment_required"
                  checked={editData?.prepayment_required || false}
                  onChange={(e) => handleFieldChange('prepayment_required', e.target.checked)}
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="prepayment_required" className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Prépaiement obligatoire
                  </div>
                  <div className="text-xs text-gray-900">
                    {editData?.prepayment_required
                      ? 'Commande bloquée jusqu\'au règlement préalable'
                      : 'Envoi et facturation simultanés'
                    }
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Délai de livraison et Devise sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Délai de livraison (jours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={editData?.delivery_time_days || ''}
                  onChange={(e) => handleFieldChange('delivery_time_days', e.target.value)}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="0"
                  min="0"
                  max="365"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Délai habituel entre commande et livraison
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Devise
              </label>
              <select
                value={editData?.currency || 'EUR'}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Montant minimum de commande */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Montant minimum de commande
            </label>
            <div className="relative">
              <input
                type="number"
                value={editData?.minimum_order_amount || ''}
                onChange={(e) => handleFieldChange('minimum_order_amount', e.target.value)}
                className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm text-gray-500">
                  {currencies.find(c => c.code === (editData?.currency || 'EUR'))?.symbol}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Montant minimum requis pour passer commande chez ce fournisseur
            </div>
          </div>

          {/* Résumé des conditions en temps réel */}
          {editData && (editData.payment_terms || editData.delivery_time_days > 0 || editData.minimum_order_amount > 0) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-1" />
                Résumé des Conditions
              </h4>

              <div className="space-y-2 text-sm">
                {editData.payment_terms && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Paiement:</span>
                    <span className="font-medium text-blue-800">{editData.payment_terms}</span>
                  </div>
                )}

                {editData.delivery_time_days > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Livraison:</span>
                    <span className="font-medium text-blue-800">
                      {editData.delivery_time_days} jour{editData.delivery_time_days > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {editData.minimum_order_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Commande min:</span>
                    <span className="font-medium text-blue-800">
                      {editData.minimum_order_amount.toFixed(2)} {editData.currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    )
  }

  // Mode affichage
  const hasCommercialInfo = organisation.payment_terms || organisation.delivery_time_days || organisation.minimum_order_amount

  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Conditions Commerciales
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {hasCommercialInfo ? (
          <div className="space-y-3">
            {organisation.payment_terms && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">💳 CONDITIONS DE PAIEMENT</div>
                <div className="text-sm font-semibold text-green-800">
                  {paymentTermsOptions.find(opt => opt.value === organisation.payment_terms)?.label || organisation.payment_terms}
                </div>
                {organisation.payment_terms === '0' && organisation.prepayment_required && (
                  <div className="text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded mt-2">
                    ⚠️ Prépaiement obligatoire - Commande bloquée jusqu'au règlement
                  </div>
                )}
              </div>
            )}

            {organisation.delivery_time_days && organisation.delivery_time_days > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  DÉLAI DE LIVRAISON
                </div>
                <div className="text-sm font-semibold text-blue-800">
                  {organisation.delivery_time_days} jour{organisation.delivery_time_days > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {organisation.minimum_order_amount && organisation.minimum_order_amount > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-black font-medium mb-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  COMMANDE MINIMUM
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {organisation.minimum_order_amount.toFixed(2)} {organisation.currency || 'EUR'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xs italic py-4">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Aucune condition commerciale renseignée
          </div>
        )}
      </div>
    </div>
  )
}