/**
 * Page: Paramètres > Notifications par Email
 * Gestion des destinataires d'emails pour les formulaires de contact
 *
 * Configuration stockée dans app_settings.notification_emails:
 * {
 *   "form_submissions": ["email1@verone.fr", "email2@verone.fr"]
 * }
 */

'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { ButtonUnified } from '@verone/ui';
import {
  Mail,
  Plus,
  Trash2,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import {
  getNotificationEmails,
  addNotificationEmail,
  removeNotificationEmail,
} from './actions';

export default function NotificationsSettingsPage(): React.JSX.Element {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load current emails
  useEffect(() => {
    void loadEmails();
  }, []);

  const loadEmails = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getNotificationEmails();
      if (result.success && result.emails) {
        setEmails(result.emails);
      } else {
        setError(result.error ?? 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Error loading emails:', err);
      setError('Erreur lors du chargement des emails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const emailTrimmed = newEmail.trim().toLowerCase();

    // Validation
    if (!emailTrimmed) {
      setError('Veuillez saisir une adresse email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Format d'email invalide");
      return;
    }

    if (emails.includes(emailTrimmed)) {
      setError('Cet email est déjà dans la liste');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await addNotificationEmail(emailTrimmed);
      if (result.success) {
        setEmails(prev => [...prev, emailTrimmed]);
        setNewEmail('');
        setSuccessMessage(`Email ${emailTrimmed} ajouté avec succès`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error ?? "Erreur lors de l'ajout");
      }
    } catch (err) {
      console.error('Error adding email:', err);
      setError("Erreur lors de l'ajout de l'email");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string): Promise<void> => {
    if (
      !confirm(`Supprimer ${emailToRemove} de la liste des notifications ?`)
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await removeNotificationEmail(emailToRemove);
      if (result.success) {
        setEmails(prev => prev.filter(e => e !== emailToRemove));
        setSuccessMessage(`Email ${emailToRemove} supprimé avec succès`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error ?? 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error removing email:', err);
      setError("Erreur lors de la suppression de l'email");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/parametres"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications par Email
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gérer les destinataires des notifications de formulaires
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">
                À propos des notifications email
              </p>
              <p>
                Les adresses configurées ici recevront un email à chaque
                nouvelle soumission de formulaire (sélections LinkMe, demandes
                de contact, SAV, etc.). Les notifications in-app restent actives
                pour tous les utilisateurs avec accès au back-office.
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-900">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Add Email Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ajouter une adresse email
          </h2>
          <form
            onSubmit={e => {
              void handleAddEmail(e);
            }}
            className="flex gap-3"
          >
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@verone.fr"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
            <ButtonUnified
              type="submit"
              variant="default"
              icon={Plus}
              iconPosition="left"
              disabled={isSaving}
            >
              {isSaving ? 'Ajout...' : 'Ajouter'}
            </ButtonUnified>
          </form>
        </div>

        {/* Email List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Destinataires actuels ({emails.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Aucun destinataire configuré
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ajoutez une adresse email ci-dessus pour commencer
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((email, index) => (
                <div
                  key={email}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Destinataire #{index + 1}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      void handleRemoveEmail(email);
                    }}
                    disabled={isSaving}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            💡 Conseils
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • Les emails sont envoyés via Resend (vérifiez la configuration
              dans <code className="bg-gray-200 px-1 rounded">.env.local</code>)
            </li>
            <li>
              • Si aucun email n'est configuré, seules les notifications in-app
              seront envoyées
            </li>
            <li>• Les doublons sont automatiquement ignorés</li>
            <li>
              • Les changements prennent effet immédiatement pour les nouvelles
              soumissions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
