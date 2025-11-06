'use client'

/**
 * ClientAssignmentSelector - Stub temporaire
 * TODO: Implémenter logique complète sélection client
 */

interface ClientAssignmentSelectorProps {
  value: string
  onChange: (clientId: string, client: any) => void
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
}

export function ClientAssignmentSelector({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  className
}: ClientAssignmentSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value, null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
      >
        <option value="">{placeholder || 'Sélectionner un client...'}</option>
        {/* TODO: Charger liste clients depuis DB */}
      </select>
    </div>
  )
}
