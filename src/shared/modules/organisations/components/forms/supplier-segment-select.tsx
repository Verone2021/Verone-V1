/**
 * Composant: SupplierSegmentSelect
 * Select pour choisir le segment stratégique d'un fournisseur
 *
 * Utilisé dans formulaires création/édition fournisseurs
 */

'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { SupplierSegmentType } from '@/components/business/supplier-segment-badge'
import { Target, Star, CheckCircle, Package, Palette } from 'lucide-react'

interface SupplierSegmentSelectProps {
  value: SupplierSegmentType | null | undefined
  onChange: (segment: SupplierSegmentType | null) => void
  disabled?: boolean
  required?: boolean
  showLabel?: boolean
  showTooltip?: boolean
  placeholder?: string
  className?: string
}

// Configuration segments avec descriptions (standards CRM/ERP)
const SEGMENT_OPTIONS = [
  {
    value: 'STRATEGIC' as SupplierSegmentType,
    label: '🎯 Stratégique',
    icon: Target,
    description: 'Fournisseurs critiques pour vos opérations principales • Produits/services essentiels au cœur de métier • Communication fréquente • Partenariats à long terme • Exemples: Fournisseur exclusif de matières premières, partenaire technologique clé',
  },
  {
    value: 'TACTICAL' as SupplierSegmentType,
    label: '⚡ Tactique',
    icon: Star,
    description: 'Soutiennent des projets spécifiques ou besoins à moyen terme • Importants mais non mission-critique • Critiques pour certaines commandes ou périodes • Remplaçables si nécessaire • Exemples: Fournisseur saisonnier, prestataire pour projet temporaire',
  },
  {
    value: 'OPERATIONAL' as SupplierSegmentType,
    label: '📋 Opérationnel',
    icon: CheckCircle,
    description: 'Achats routiniers et besoins quotidiens • Impact modéré sur les opérations • Focus sur l\'efficacité opérationnelle • Services et fournitures courantes • Exemples: Fournitures de bureau, entretien, maintenance standard',
  },
  {
    value: 'COMMODITY' as SupplierSegmentType,
    label: '📦 Commodité',
    icon: Package,
    description: 'Produits standards facilement remplaçables • Faible valeur ajoutée et faible risque • Nombreuses alternatives sur le marché • Gestion transactionnelle simple • Exemples: Consommables génériques, emballages standards, matériel non spécifique',
  },
]

export function SupplierSegmentSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  showLabel = true,
  showTooltip = true,
  placeholder = 'Sélectionner un segment...',
  className,
}: SupplierSegmentSelectProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === 'null') {
      onChange(null)
    } else {
      onChange(newValue as SupplierSegmentType)
    }
  }

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor="supplier-segment" className="mb-2 block">
          Segment fournisseur {required && <span className="text-danger-500">*</span>}
        </Label>
      )}

      <Select value={value || 'null'} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id="supplier-segment" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Option vide si pas required */}
          {!required && (
            <SelectItem value="null">
              <span className="text-neutral-500">Aucun segment</span>
            </SelectItem>
          )}

          {/* Options segments */}
          {SEGMENT_OPTIONS.map((segment) => (
            <SelectItem key={segment.value} value={segment.value}>
              <div className="flex items-center gap-2">
                <span>{segment.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tooltip explicatif */}
      {showTooltip && value && (
        <p className="mt-1.5 text-xs text-neutral-600">
          {SEGMENT_OPTIONS.find((s) => s.value === value)?.description}
        </p>
      )}

      {/* Helper text général */}
      {!value && showTooltip && (
        <p className="mt-1.5 text-xs text-neutral-500">
          Le segment détermine la criticité stratégique du fournisseur
        </p>
      )}
    </div>
  )
}

/**
 * Hook helper: Obtenir la configuration d'un segment
 */
export function useSegmentConfig(segment: SupplierSegmentType | null | undefined) {
  if (!segment) return null
  return SEGMENT_OPTIONS.find((s) => s.value === segment) || null
}

/**
 * Helper: Obtenir le label d'un segment
 */
export function getSegmentLabel(segment: SupplierSegmentType | null | undefined): string {
  if (!segment) return 'Non défini'
  const config = SEGMENT_OPTIONS.find((s) => s.value === segment)
  return config?.label || segment
}
