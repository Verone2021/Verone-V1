'use client';

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Toutes', description: 'Info + Important + Urgent' },
  {
    value: 'important',
    label: 'Important+',
    description: 'Important et Urgent uniquement',
  },
  {
    value: 'urgent',
    label: 'Urgent uniquement',
    description: 'Seulement les urgences',
  },
] as const;

interface SeveritySelectorProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function SeveritySelector({
  value,
  disabled,
  onChange,
}: SeveritySelectorProps) {
  return (
    <div className="px-6 py-4">
      <p className="text-sm font-medium text-gray-900 mb-3">
        Niveau minimum de severite
      </p>
      <div className="flex gap-2">
        {SEVERITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
              value === opt.value
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span>{opt.label}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
