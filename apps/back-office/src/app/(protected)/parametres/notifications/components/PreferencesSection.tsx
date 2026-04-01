'use client';

import { Loader2, Zap } from 'lucide-react';

import type { NotificationPreferences } from '../actions';

import { CategoryToggle, CATEGORIES } from './CategoryToggle';
import { SeveritySelector } from './SeveritySelector';
import { EmailPrefsToggle } from './EmailPrefsToggle';

interface PreferencesSectionProps {
  prefs: NotificationPreferences | null;
  loading: boolean;
  saving: boolean;
  onToggleCategory: (
    key: (typeof CATEGORIES)[number]['key'],
    value: boolean
  ) => void;
  onSeverityChange: (value: string) => void;
  onToggleEmail: (
    key: 'email_enabled' | 'email_urgent_only',
    value: boolean
  ) => void;
}

export function PreferencesSection({
  prefs,
  loading,
  saving,
  onToggleCategory,
  onSeverityChange,
  onToggleEmail,
}: PreferencesSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications in-app
          </h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Choisissez les types de notifications que vous souhaitez recevoir
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin mx-auto" />
        </div>
      ) : prefs ? (
        <div className="divide-y divide-gray-100">
          {CATEGORIES.map(cat => (
            <CategoryToggle
              key={cat.key}
              category={cat}
              enabled={prefs[cat.key]}
              disabled={saving}
              onToggle={value => onToggleCategory(cat.key, value)}
            />
          ))}
          <SeveritySelector
            value={prefs.min_severity}
            disabled={saving}
            onChange={onSeverityChange}
          />
          <EmailPrefsToggle
            emailEnabled={prefs.email_enabled}
            emailUrgentOnly={prefs.email_urgent_only}
            disabled={saving}
            onToggle={onToggleEmail}
          />
        </div>
      ) : null}
    </section>
  );
}
