'use client'

import { useState, useEffect } from 'react'
import { MapPin, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Organisation } from '@/hooks/use-organisations'

interface AddressInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  selectedOrganisation?: Organisation | null
  disabled?: boolean
  className?: string
}

export function AddressInput({
  label,
  value,
  onChange,
  placeholder,
  selectedOrganisation,
  disabled = false,
  className = ""
}: AddressInputProps) {
  const [showCopyButton, setShowCopyButton] = useState(false)

  // Vérifier si l'organisation a une adresse complète
  useEffect(() => {
    if (selectedOrganisation) {
      const hasAddress = selectedOrganisation.address_line1 ||
                        selectedOrganisation.city ||
                        selectedOrganisation.postal_code
      setShowCopyButton(hasAddress)
    } else {
      setShowCopyButton(false)
    }
  }, [selectedOrganisation])

  // Formatter l'adresse de l'organisation
  const formatOrganisationAddress = (org: Organisation): string => {
    const parts = [
      org.name,
      org.address_line1,
      org.address_line2,
      [org.postal_code, org.city].filter(Boolean).join(' '),
      org.region,
      org.country
    ].filter(Boolean)

    return parts.join('\n')
  }

  // Copier l'adresse de l'organisation
  const copyOrganisationAddress = () => {
    if (selectedOrganisation) {
      const formattedAddress = formatOrganisationAddress(selectedOrganisation)
      onChange(formattedAddress)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
          {label}
        </Label>
        {showCopyButton && selectedOrganisation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyOrganisationAddress}
            className="h-8 px-2 text-xs"
            disabled={disabled}
          >
            <Copy className="h-3 w-3 mr-1" />
            Utiliser adresse {selectedOrganisation.type === 'customer' ? 'client' : 'fournisseur'}
          </Button>
        )}
      </div>

      <Textarea
        id={label.toLowerCase().replace(/\s+/g, '-')}
        placeholder={placeholder || `${label} complète...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={disabled}
      />

      {showCopyButton && selectedOrganisation && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <div className="flex items-center space-x-1 mb-1">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">Adresse disponible :</span>
          </div>
          <div className="whitespace-pre-line">
            {formatOrganisationAddress(selectedOrganisation)}
          </div>
        </div>
      )}
    </div>
  )
}