'use client'

import { Building, User } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CustomerType } from '@/hooks/use-customers'

interface CustomerTypeSelectorProps {
  value: CustomerType | null
  onValueChange: (value: CustomerType) => void
  disabled?: boolean
}

export function CustomerTypeSelector({ value, onValueChange, disabled = false }: CustomerTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-900">Type de client *</Label>
      <RadioGroup
        value={value || ''}
        onValueChange={(newValue) => onValueChange(newValue as CustomerType)}
        disabled={disabled}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="professional" id="professional" />
          <Label htmlFor="professional" className="flex items-center gap-2 cursor-pointer flex-1">
            <Building className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">Client professionnel</div>
              <div className="text-xs text-gray-500">Entreprise, organisation (B2B)</div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="individual" id="individual" />
          <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer flex-1">
            <User className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">Client particulier</div>
              <div className="text-xs text-gray-500">Personne physique (B2C)</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}