/**
 * Page: Parametres > Notifications
 *
 * 2 sections :
 * 1. Preferences individuelles in-app (types, severite, email)
 * 2. Destinataires email systeme (form submissions)
 */

'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import {
  Bell,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import {
  getNotificationEmails,
  addNotificationEmail,
  removeNotificationEmail,
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from './actions';
import type { NotificationCategory } from './components/CategoryToggle';
import { PreferencesSection } from './components/PreferencesSection';
import { EmailRecipientsSection } from './components/EmailRecipientsSection';

export default function NotificationsSettingsPage(): React.JSX.Element {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadEmails();
    void loadPreferences();
  }, []);

  const loadEmails = async () => {
    setEmailsLoading(true);
    try {
      const result = await getNotificationEmails();
      if (result.success && result.emails) setEmails(result.emails);
    } catch (err) {
      console.error('[Notifications] Load emails failed:', err);
    } finally {
      setEmailsLoading(false);
    }
  };

  const loadPreferences = async () => {
    setPrefsLoading(true);
    try {
      const result = await getNotificationPreferences();
      if (result.success) setPrefs(result.preferences);
    } catch (err) {
      console.error('[Notifications] Load preferences failed:', err);
    } finally {
      setPrefsLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleToggleCategory = async (
    key: NotificationCategory['key'],
    value: boolean
  ) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setIsSaving(true);
    try {
      const result = await saveNotificationPreferences(updated);
      if (!result.success) setError(result.error ?? 'Erreur sauvegarde');
    } catch (err) {
      console.error('[Notifications] Toggle failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeverityChange = async (value: string) => {
    if (!prefs) return;
    const updated = {
      ...prefs,
      min_severity: value as NotificationPreferences['min_severity'],
    };
    setPrefs(updated);
    setIsSaving(true);
    try {
      const result = await saveNotificationPreferences(updated);
      if (result.success) showSuccess('Filtre severite mis a jour');
      else setError(result.error ?? 'Erreur sauvegarde');
    } catch (err) {
      console.error('[Notifications] Severity change failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmail = async (
    key: 'email_enabled' | 'email_urgent_only',
    value: boolean
  ) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setIsSaving(true);
    try {
      const result = await saveNotificationPreferences(updated);
      if (!result.success) setError(result.error ?? 'Erreur sauvegarde');
    } catch (err) {
      console.error('[Notifications] Email toggle failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = newEmail.trim().toLowerCase();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Format d'email invalide");
      return;
    }
    if (emails.includes(emailTrimmed)) {
      setError('Cet email est deja dans la liste');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const result = await addNotificationEmail(emailTrimmed);
      if (result.success) {
        setEmails(prev => [...prev, emailTrimmed]);
        setNewEmail('');
        showSuccess(`${emailTrimmed} ajoute`);
      } else {
        setError(result.error ?? "Erreur lors de l'ajout");
      }
    } catch (err) {
      console.error('[Notifications] Add email failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!confirm(`Supprimer ${emailToRemove} ?`)) return;
    setIsSaving(true);
    try {
      const result = await removeNotificationEmail(emailToRemove);
      if (result.success) {
        setEmails(prev => prev.filter(e => e !== emailToRemove));
        showSuccess(`${emailToRemove} supprime`);
      }
    } catch (err) {
      console.error('[Notifications] Remove email failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/parametres"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-sm text-gray-500">
                  Preferences individuelles et destinataires email
                </p>
              </div>
            </div>
            {isSaving && (
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-900">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <PreferencesSection
          prefs={prefs}
          loading={prefsLoading}
          saving={isSaving}
          onToggleCategory={(key, value) => {
            void handleToggleCategory(key, value);
          }}
          onSeverityChange={value => {
            void handleSeverityChange(value);
          }}
          onToggleEmail={(key, value) => {
            void handleToggleEmail(key, value);
          }}
        />

        <EmailRecipientsSection
          emails={emails}
          newEmail={newEmail}
          loading={emailsLoading}
          saving={isSaving}
          onNewEmailChange={setNewEmail}
          onAddEmail={e => {
            void handleAddEmail(e);
          }}
          onRemoveEmail={email => {
            void handleRemoveEmail(email);
          }}
        />
      </div>
    </div>
  );
}
