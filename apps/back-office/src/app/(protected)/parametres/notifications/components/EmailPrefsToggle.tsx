'use client';

interface EmailPrefsToggleProps {
  emailEnabled: boolean;
  emailUrgentOnly: boolean;
  disabled: boolean;
  onToggle: (
    key: 'email_enabled' | 'email_urgent_only',
    value: boolean
  ) => void;
}

function Toggle({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function EmailPrefsToggle({
  emailEnabled,
  emailUrgentOnly,
  disabled,
  onToggle,
}: EmailPrefsToggleProps) {
  return (
    <div className="px-6 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Recevoir aussi par email
          </p>
          <p className="text-xs text-gray-500">
            En plus des notifications in-app
          </p>
        </div>
        <Toggle
          checked={emailEnabled}
          disabled={disabled}
          onClick={() => onToggle('email_enabled', !emailEnabled)}
        />
      </div>
      {emailEnabled && (
        <div className="flex items-center justify-between ml-12">
          <p className="text-sm text-gray-600">Urgent uniquement par email</p>
          <Toggle
            checked={emailUrgentOnly}
            disabled={disabled}
            onClick={() => onToggle('email_urgent_only', !emailUrgentOnly)}
          />
        </div>
      )}
    </div>
  );
}
