'use client';

import { useState } from 'react';

import { Building2, Save, X, Edit, FileText } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';
import {
  useInlineEdit,
  type EditableSection,
} from '@/shared/modules/common/hooks';

interface Organisation {
  id: string;
  legal_name: string;
  trade_name?: string | null;
  has_different_trade_name?: boolean | null;
  siren?: string | null;
  siret?: string | null;
}

interface LegalIdentityEditSectionProps {
  organisation: Organisation;
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void;
  className?: string;
}

export function LegalIdentityEditSection({
  organisation,
  onUpdate,
  className,
}: LegalIdentityEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    organisationId: organisation.id,
    onUpdate: updatedData => {
      onUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour identité légale:', error);
    },
  });

  const section: EditableSection = 'legal';
  const editData = getEditedData(section);
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      legal_name: organisation.legal_name,
      trade_name: organisation.trade_name || '',
      has_different_trade_name: organisation.has_different_trade_name || false,
      siren: organisation.siren || '',
      siret: organisation.siret || '',
    });
  };

  const handleSave = async () => {
    // Nettoyer les données avant sauvegarde (trim des espaces)
    const cleanedData = Object.fromEntries(
      Object.entries(editData || {}).map(([key, val]) => {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          // Convertir les chaînes vides en null pour les champs optionnels
          return [key, trimmed === '' ? null : trimmed];
        }
        return [key, val];
      })
    );

    // Mettre à jour avec les données nettoyées
    updateEditedData(section, cleanedData);

    // Attendre un tick pour que l'état soit mis à jour
    await new Promise(resolve => setTimeout(resolve, 0));

    // Récupérer les données nettoyées pour validation
    const dataToValidate = getEditedData(section);

    // Validation SIREN (9 chiffres)
    if (dataToValidate?.siren?.trim()) {
      const sirenClean = dataToValidate.siren.replace(/\s/g, '');
      if (!/^\d{9}$/.test(sirenClean)) {
        updateEditedData(section, {
          _error: 'Le SIREN doit contenir exactement 9 chiffres',
        });
        return;
      }
    }

    // Validation SIRET (14 chiffres)
    if (dataToValidate?.siret?.trim()) {
      const siretClean = dataToValidate.siret.replace(/\s/g, '');
      if (!/^\d{14}$/.test(siretClean)) {
        updateEditedData(section, {
          _error: 'Le SIRET doit contenir exactement 14 chiffres',
        });
        return;
      }
    }

    // Validation trade_name si has_different_trade_name = true
    if (
      dataToValidate?.has_different_trade_name &&
      !dataToValidate?.trade_name?.trim()
    ) {
      updateEditedData(section, {
        _error:
          'Le nom commercial est requis si vous cochez "Nom commercial différent"',
      });
      return;
    }

    const success = await saveChanges(section);
    if (success) {
      console.log('✅ Identité légale mise à jour avec succès');
    }
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    // Pas de trim ici, seulement à la sauvegarde
    let processedValue = value;

    if (typeof value === 'string') {
      // Nettoyage SIREN/SIRET (enlever espaces)
      if (field === 'siren' || field === 'siret') {
        processedValue = value.replace(/\s/g, '');
      }
    }

    updateEditedData(section, { [field]: processedValue || null });

    // Si on décoche has_different_trade_name, vider trade_name
    if (field === 'has_different_trade_name' && !value) {
      updateEditedData(section, { trade_name: null });
    }
  };

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-black flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Identité Légale
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
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Dénomination sociale */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Dénomination sociale *
            </label>
            <input
              type="text"
              value={editData?.legal_name || ''}
              onChange={e => handleFieldChange('legal_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Nom officiel enregistré au RCS"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Nom officiel de l'entreprise enregistré au Registre du Commerce et
              des Sociétés
            </div>
          </div>

          {/* Checkbox: Nom commercial différent */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has_different_trade_name"
              checked={editData?.has_different_trade_name || false}
              onChange={e =>
                handleFieldChange('has_different_trade_name', e.target.checked)
              }
              className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
            />
            <label
              htmlFor="has_different_trade_name"
              className="text-sm font-medium text-black cursor-pointer"
            >
              Le nom commercial est différent de la dénomination sociale
            </label>
          </div>

          {/* Nom commercial (conditionnel) */}
          {editData?.has_different_trade_name && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Nom commercial *
              </label>
              <input
                type="text"
                value={editData?.trade_name || ''}
                onChange={e => handleFieldChange('trade_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Nom utilisé publiquement"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Nom sous lequel l'entreprise opère commercialement
              </div>
            </div>
          )}

          {/* SIREN */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              SIREN
            </label>
            <input
              type="text"
              value={editData?.siren || ''}
              onChange={e => handleFieldChange('siren', e.target.value)}
              className={cn(
                'w-full px-3 py-2 font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black',
                editData?.siren &&
                  !/^\d{9}$/.test(editData.siren.replace(/\s/g, ''))
                  ? 'border-red-300'
                  : 'border-gray-300'
              )}
              placeholder="123 456 789"
              maxLength={11}
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-gray-500">
                9 chiffres • Obligatoire sur factures depuis juillet 2024
              </div>
              {editData?.siren && (
                <div
                  className={cn(
                    'text-xs font-medium',
                    /^\d{9}$/.test(editData.siren.replace(/\s/g, ''))
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {/^\d{9}$/.test(editData.siren.replace(/\s/g, ''))
                    ? '✓ Valide'
                    : '✗ Format invalide'}
                </div>
              )}
            </div>
          </div>

          {/* SIRET */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              SIRET
            </label>
            <input
              type="text"
              value={editData?.siret || ''}
              onChange={e => handleFieldChange('siret', e.target.value)}
              className={cn(
                'w-full px-3 py-2 font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black',
                editData?.siret &&
                  !/^\d{14}$/.test(editData.siret.replace(/\s/g, ''))
                  ? 'border-red-300'
                  : 'border-gray-300'
              )}
              placeholder="123 456 789 00012"
              maxLength={17}
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-gray-500">
                14 chiffres • SIREN + numéro d'établissement
              </div>
              {editData?.siret && (
                <div
                  className={cn(
                    'text-xs font-medium',
                    /^\d{14}$/.test(editData.siret.replace(/\s/g, ''))
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {/^\d{14}$/.test(editData.siret.replace(/\s/g, ''))
                    ? '✓ Valide'
                    : '✗ Format invalide'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage
  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-black flex items-center">
          <Building2 className="h-4 w-4 mr-2" />
          Identité Légale
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {/* Dénomination sociale */}
        <div>
          <span className="text-sm text-black opacity-70 flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            Dénomination sociale:
          </span>
          <div className="text-lg font-semibold text-black">
            {organisation.legal_name}
          </div>
        </div>

        {/* Nom commercial (si différent) */}
        {organisation.has_different_trade_name && organisation.trade_name && (
          <div>
            <span className="text-sm text-black opacity-70">
              Nom commercial:
            </span>
            <div className="text-sm font-medium text-black">
              {organisation.trade_name}
            </div>
          </div>
        )}

        {/* SIREN */}
        {organisation.siren && (
          <div>
            <span className="text-sm text-black opacity-70">SIREN:</span>
            <div className="font-mono text-sm font-medium text-black">
              {organisation.siren}
            </div>
          </div>
        )}

        {/* SIRET */}
        {organisation.siret && (
          <div>
            <span className="text-sm text-black opacity-70">SIRET:</span>
            <div className="font-mono text-sm font-medium text-black">
              {organisation.siret}
            </div>
          </div>
        )}

        {/* Message si aucune info */}
        {!organisation.siren &&
          !organisation.siret &&
          !organisation.trade_name && (
            <div className="text-center text-gray-400 text-xs italic py-2">
              Informations légales complémentaires non renseignées
            </div>
          )}
      </div>
    </div>
  );
}
