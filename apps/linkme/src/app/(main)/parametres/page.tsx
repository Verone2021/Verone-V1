'use client';

import { useState } from 'react';

import {
  Check,
  Copy,
  Euro,
  Loader2,
  Package,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShoppingCart,
  Star,
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import {
  type IAffiliateBranding,
  useAffiliateBranding,
} from '../../../lib/hooks/use-affiliate-branding';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

// ============================================================================
// Color Picker Input Component
// ============================================================================

interface IColorPickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorPickerInput({
  label,
  value,
  onChange,
  description,
}: IColorPickerInputProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 p-1"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={value.toUpperCase()}
            onChange={e => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                onChange(val);
              }
            }}
            className="w-24 px-2 py-1 text-sm font-mono border border-gray-200 rounded"
            placeholder="#5DBEBB"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copier la couleur"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Card Component
// ============================================================================

interface IPreviewCardProps {
  branding: IAffiliateBranding;
}

function PreviewCard({ branding }: IPreviewCardProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg border border-gray-200"
      style={{ backgroundColor: branding.background_color }}
    >
      {/* Image placeholder */}
      <div className="relative h-40 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <Package className="h-16 w-16" />
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span
            className="text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
            style={{ backgroundColor: branding.accent_color }}
          >
            <Star className="h-3 w-3 fill-current" />
            Vedette
          </span>
          <span
            className="text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
            style={{ backgroundColor: branding.primary_color }}
          >
            Stock: 42
          </span>
        </div>
      </div>
      {/* Product info */}
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">PRD-0001</p>
        <h3
          className="font-medium line-clamp-2 mb-3"
          style={{ color: branding.text_color }}
        >
          Exemple de produit
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span
            className="text-xl font-bold"
            style={{ color: branding.text_color }}
          >
            99,00 €
          </span>
          <span className="text-sm text-gray-500">TTC</span>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 text-white py-3 px-4 rounded-lg transition-colors"
          style={{
            backgroundColor: isHovered
              ? branding.secondary_color
              : branding.primary_color,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <ShoppingCart className="h-4 w-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ParametresPage(): React.JSX.Element {
  const { initializing: authLoading } = useAuth();
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  const {
    branding,
    isLoading: brandingLoading,
    updateBranding,
    resetToDefaults,
    isUpdating,
  } = useAffiliateBranding(affiliate?.id ?? null);

  // Local state for preview (before save)
  const [localBranding, setLocalBranding] = useState<IAffiliateBranding | null>(
    null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Use local state if modified, otherwise use DB value
  const displayBranding = localBranding ?? branding;

  // Handle color change (local only)
  const handleColorChange = (
    key: keyof IAffiliateBranding,
    value: string
  ): void => {
    setLocalBranding(prev => ({
      ...(prev ?? branding),
      [key]: value,
    }));
    setSaveSuccess(false);
  };

  // Save to database
  const handleSave = async (): Promise<void> => {
    if (!localBranding) return;

    try {
      await updateBranding(localBranding);
      setSaveSuccess(true);
      // Reset local state after successful save
      setLocalBranding(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save branding:', error);
    }
  };

  // Reset to LinkMe defaults
  const handleReset = async (): Promise<void> => {
    try {
      await resetToDefaults();
      setLocalBranding(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to reset branding:', error);
    }
  };

  // Loading state
  if (authLoading || affiliateLoading || brandingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-linkme-turquoise" />
      </div>
    );
  }

  // No affiliate
  if (!affiliate) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Vous devez être connecté en tant qu&apos;affilié pour accéder aux
          paramètres.
        </div>
      </div>
    );
  }

  const hasChanges = localBranding !== null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-linkme-turquoise" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500">
            Personnalisez l&apos;apparence de votre mini-site
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Color Pickers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-5 w-5 text-linkme-mauve" />
            <h2 className="text-lg font-semibold text-gray-900">
              Couleurs de votre mini-site
            </h2>
          </div>

          <div className="space-y-6">
            <ColorPickerInput
              label="Couleur principale"
              value={displayBranding.primary_color}
              onChange={v => handleColorChange('primary_color', v)}
              description="Boutons, badges stock"
            />

            <ColorPickerInput
              label="Couleur secondaire"
              value={displayBranding.secondary_color}
              onChange={v => handleColorChange('secondary_color', v)}
              description="Hover des boutons"
            />

            <ColorPickerInput
              label="Couleur accent"
              value={displayBranding.accent_color}
              onChange={v => handleColorChange('accent_color', v)}
              description="Badge Vedette"
            />

            <ColorPickerInput
              label="Couleur du texte"
              value={displayBranding.text_color}
              onChange={v => handleColorChange('text_color', v)}
              description="Titres et prix"
            />

            <ColorPickerInput
              label="Couleur de fond"
              value={displayBranding.background_color}
              onChange={v => handleColorChange('background_color', v)}
              description="Fond des cartes"
            />
          </div>

          {/* Price display mode */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Euro className="h-5 w-5 text-linkme-mauve" />
              <h2 className="text-lg font-semibold text-gray-900">
                Affichage des prix
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Afficher les prix sur votre mini-site en :
              </span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleColorChange('price_display_mode', 'HT')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    displayBranding.price_display_mode === 'HT'
                      ? 'bg-linkme-turquoise text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  HT
                </button>
                <button
                  type="button"
                  onClick={() => handleColorChange('price_display_mode', 'TTC')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    displayBranding.price_display_mode === 'TTC'
                      ? 'bg-linkme-turquoise text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  TTC
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Les prix seront affichés{' '}
              {displayBranding.price_display_mode === 'TTC'
                ? 'toutes taxes comprises'
                : 'hors taxes'}{' '}
              sur votre page publique
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => void handleReset()}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Défauts LinkMe
            </button>

            <button
              onClick={() => void handleSave()}
              disabled={!hasChanges || isUpdating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-royal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveSuccess ? 'Enregistré !' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aperçu en temps réel
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Voici comment vos produits apparaîtront sur votre mini-site public
            </p>

            {/* Preview card */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <PreviewCard branding={displayBranding} />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Astuce :</strong> Vos clients verront ces couleurs sur
              votre page publique. Les changements seront visibles dès
              l&apos;enregistrement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
