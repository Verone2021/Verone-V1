'use client';

import { useMemo, useState } from 'react';

import {
  useInlineEdit,
  type EditableSection,
} from '@verone/common/hooks/use-inline-edit';
import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  CreditCard,
  Save,
  X,
  Edit,
  Clock,
  DollarSign,
  Package,
  Info,
  Receipt,
} from 'lucide-react';

import {
  VAT_RATES,
  DEFAULT_VAT_RATE,
  formatVatRate,
} from '../forms/unified-organisation-form/constants';

interface Organisation {
  id: string;
  payment_terms?: string | null;
  delivery_time_days?: number | null;
  minimum_order_amount?: number | null;
  currency?: string | null;
  default_vat_rate?: number | null;
  prepayment_required?: boolean | null;
  ownership_type?: 'succursale' | 'franchise' | null;
  enseigne_id?: string | null;
  enseigne?: {
    name: string;
  } | null;
}

interface CommercialEditSectionProps {
  organisation: Organisation;
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void;
  className?: string;
  organisationType: 'supplier' | 'service_provider' | 'customer';
}

// Type pour les données commerciales éditées
interface CommercialEditData {
  payment_terms?: string | null;
  delivery_time_days?: number | null;
  minimum_order_amount?: number | null;
  currency?: string | null;
  default_vat_rate?: number | null;
  prepayment_required?: boolean | null;
}

export function CommercialEditSection({
  organisation,
  onUpdate,
  className,
  organisationType,
}: CommercialEditSectionProps) {
  // Déterminer si les conditions commerciales sont éditables
  const isEditableCommercial = useMemo(() => {
    // Clients professionnels succursales (restaurant propre)
    if (
      organisationType === 'customer' &&
      organisation.ownership_type === 'succursale'
    ) {
      return false; // ❌ Read-only : hérite de l'enseigne
    }
    return true; // ✅ Éditable : franchise ou autre type
  }, [organisationType, organisation.ownership_type]);

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
    onUpdate: (updatedData: Partial<Organisation>) => {
      onUpdate(updatedData);
    },
    onError: (error: string) => {
      console.error('❌ Erreur mise à jour conditions commerciales:', error);
    },
  });

  // Édition TVA indépendante : la TVA dépend du pays de l'organisation,
  // pas du fait que ce soit une succursale. Modifiable même quand le reste
  // de la section commerciale est read-only (hérité de l'enseigne).
  const [vatEditing, setVatEditing] = useState(false);
  const [vatValue, setVatValue] = useState<number>(
    organisation.default_vat_rate ?? DEFAULT_VAT_RATE
  );
  const [vatSaving, setVatSaving] = useState(false);
  const [vatError, setVatError] = useState<string | null>(null);

  const handleVatEdit = () => {
    setVatValue(organisation.default_vat_rate ?? DEFAULT_VAT_RATE);
    setVatError(null);
    setVatEditing(true);
  };

  const handleVatCancel = () => {
    setVatEditing(false);
    setVatError(null);
  };

  const handleVatSave = async () => {
    setVatSaving(true);
    setVatError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update({ default_vat_rate: vatValue })
        .eq('id', organisation.id);
      if (error) {
        setVatError(error.message);
        return;
      }
      onUpdate({ default_vat_rate: vatValue });
      setVatEditing(false);
    } catch (err) {
      setVatError(
        err instanceof Error ? err.message : 'Erreur mise à jour TVA'
      );
    } finally {
      setVatSaving(false);
    }
  };

  const section: EditableSection = 'commercial';
  const editData = getEditedData(section) as CommercialEditData | null;
  const error = getError(section);

  const handleStartEdit = () => {
    startEdit(section, {
      payment_terms: organisation.payment_terms ?? '',
      delivery_time_days: organisation.delivery_time_days ?? 0,
      minimum_order_amount: organisation.minimum_order_amount ?? 0,
      currency: organisation.currency ?? 'EUR',
      default_vat_rate: organisation.default_vat_rate ?? DEFAULT_VAT_RATE,
      prepayment_required: organisation.prepayment_required ?? false,
    });
  };

  const handleSave = async () => {
    // Validation business rules
    if (editData?.delivery_time_days && editData.delivery_time_days < 0) {
      alert('⚠️ Le délai de livraison ne peut pas être négatif');
      return;
    }

    if (editData?.minimum_order_amount && editData.minimum_order_amount < 0) {
      alert('⚠️ Le montant minimum de commande ne peut pas être négatif');
      return;
    }

    await saveChanges(section);
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handleFieldChange = (
    field: keyof CommercialEditData,
    value: string | number | boolean
  ) => {
    let processedValue: string | number | boolean | null = value;

    if (field === 'delivery_time_days') {
      processedValue = parseInt(value.toString()) || 0;
    }

    if (field === 'minimum_order_amount') {
      processedValue = parseFloat(value.toString()) || 0;
    }

    if (field === 'default_vat_rate') {
      processedValue = parseFloat(value.toString());
      if (Number.isNaN(processedValue)) processedValue = DEFAULT_VAT_RATE;
    }

    updateEditedData(section, { [field]: processedValue });
  };

  // Options de devises
  const currencies = [
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'USD', name: 'Dollar US ($)', symbol: '$' },
    { code: 'GBP', name: 'Livre Sterling (£)', symbol: '£' },
    { code: 'CHF', name: 'Franc Suisse (CHF)', symbol: 'CHF' },
  ];

  // Options de conditions de paiement - Enum strict (filtrable pour business logic)
  const paymentTermsOptions = [
    { value: 'PREPAID', label: 'Prépaiement obligatoire', days: 0 },
    { value: 'NET_30', label: '30 jours net', days: 30 },
    { value: 'NET_60', label: '60 jours net', days: 60 },
    { value: 'NET_90', label: '90 jours net', days: 90 },
  ];

  if (isEditing(section) && isEditableCommercial) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-black flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Conditions Commerciales
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void handleSave();
              }}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {/* Conditions de paiement + Devise sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Conditions de paiement
              </label>
              <select
                value={editData?.payment_terms ?? ''}
                onChange={e =>
                  handleFieldChange('payment_terms', e.target.value)
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="">Sélectionner...</option>
                {paymentTermsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Devise
              </label>
              <select
                value={editData?.currency ?? 'EUR'}
                onChange={e => handleFieldChange('currency', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TVA par défaut */}
          <div>
            <label className="block text-xs font-medium text-black mb-1">
              TVA par défaut
            </label>
            <select
              value={String(editData?.default_vat_rate ?? DEFAULT_VAT_RATE)}
              onChange={e =>
                handleFieldChange('default_vat_rate', e.target.value)
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              {VAT_RATES.map(option => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Appliquée par défaut aux nouvelles commandes de ce client.
            </p>
          </div>

          {/* Délai de livraison - Fournisseurs seulement */}
          {organisationType !== 'customer' && (
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Délai de livraison (jours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={editData?.delivery_time_days ?? ''}
                  onChange={e =>
                    handleFieldChange('delivery_time_days', e.target.value)
                  }
                  className="w-full px-2 py-1.5 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="0"
                  min="0"
                  max="365"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Montant minimum de commande - Fournisseurs et prestataires uniquement */}
          {organisationType !== 'customer' && (
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Montant minimum de commande
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={editData?.minimum_order_amount ?? ''}
                  onChange={e =>
                    handleFieldChange('minimum_order_amount', e.target.value)
                  }
                  className="w-full px-2 py-1.5 pr-12 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <span className="text-xs text-gray-500">
                    {
                      currencies.find(
                        c => c.code === (editData?.currency ?? 'EUR')
                      )?.symbol
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Résumé des conditions en temps réel */}
          {editData &&
            (!!editData.payment_terms ||
              (editData.delivery_time_days ?? 0) > 0 ||
              (editData.minimum_order_amount ?? 0) > 0) && (
              <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                <h4 className="text-xs font-medium text-blue-800 mb-1.5 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  Résumé
                </h4>

                <div className="space-y-1 text-xs">
                  {editData.payment_terms && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Paiement:</span>
                      <span className="font-medium text-blue-800">
                        {
                          paymentTermsOptions.find(
                            opt => opt.value === editData.payment_terms
                          )?.label
                        }
                      </span>
                    </div>
                  )}

                  {(editData.delivery_time_days ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Livraison:</span>
                      <span className="font-medium text-blue-800">
                        {editData.delivery_time_days} j
                        {(editData.delivery_time_days ?? 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {(editData.minimum_order_amount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Min:</span>
                      <span className="font-medium text-blue-800">
                        {(editData.minimum_order_amount ?? 0).toFixed(2)}{' '}
                        {editData.currency}
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
    );
  }

  // Mode affichage
  const hasVatRate =
    organisation.default_vat_rate !== null &&
    organisation.default_vat_rate !== undefined;
  const hasCommercialInfo =
    !!organisation.payment_terms ||
    !!organisation.delivery_time_days ||
    !!organisation.minimum_order_amount ||
    hasVatRate;

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Conditions Commerciales
        </h3>
        <div className="flex items-center gap-3">
          {!isEditableCommercial && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Héritées de l'enseigne parent</span>
            </div>
          )}
          {isEditableCommercial && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {!isEditableCommercial &&
          organisation.ownership_type === 'succursale' &&
          organisation.enseigne_id && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Restaurant appartenant à l'enseigne{' '}
                    {organisation.enseigne?.name
                      ? `"${organisation.enseigne.name}"`
                      : 'parent'}
                  </p>
                  <p className="text-xs">
                    Les conditions commerciales sont définies au niveau de
                    l'enseigne et ne peuvent pas être modifiées
                    individuellement.
                  </p>
                </div>
              </div>
            </div>
          )}

        {hasCommercialInfo ? (
          <div className="space-y-3">
            {organisation.payment_terms && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-1">
                  💳 CONDITIONS DE PAIEMENT
                </div>
                <div className="text-sm font-semibold text-green-800">
                  {paymentTermsOptions.find(
                    opt => opt.value === organisation.payment_terms
                  )?.label ?? organisation.payment_terms}
                </div>
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-amber-700 font-medium mb-1 flex items-center">
                    <Receipt className="h-3 w-3 mr-1" />
                    TVA PAR DÉFAUT
                  </div>
                  {vatEditing ? (
                    <select
                      value={String(vatValue)}
                      onChange={e => setVatValue(parseFloat(e.target.value))}
                      disabled={vatSaving}
                      className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {VAT_RATES.map(option => (
                        <option key={option.value} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-amber-900">
                      {hasVatRate
                        ? formatVatRate(organisation.default_vat_rate)
                        : 'Non définie'}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-amber-700/80">
                    Dépend du pays du client (France = 20 %, autres = 0 %).
                    Appliquée par défaut aux nouvelles commandes.
                  </p>
                  {vatError && (
                    <p className="mt-1 text-[11px] text-red-600">
                      ❌ {vatError}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex gap-1">
                  {vatEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVatCancel}
                        disabled={vatSaving}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          void handleVatSave();
                        }}
                        disabled={
                          vatSaving ||
                          vatValue ===
                            (organisation.default_vat_rate ?? DEFAULT_VAT_RATE)
                        }
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {vatSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleVatEdit}>
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {organisationType !== 'customer' &&
              organisation.delivery_time_days &&
              organisation.delivery_time_days > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    DÉLAI DE LIVRAISON
                  </div>
                  <div className="text-sm font-semibold text-blue-800">
                    {organisation.delivery_time_days} jour
                    {organisation.delivery_time_days > 1 ? 's' : ''}
                  </div>
                </div>
              )}

            {organisationType !== 'customer' &&
              organisation.minimum_order_amount &&
              organisation.minimum_order_amount > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-black font-medium mb-1 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    COMMANDE MINIMUM
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {organisation.minimum_order_amount.toFixed(2)}{' '}
                    {organisation.currency ?? 'EUR'}
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
  );
}
