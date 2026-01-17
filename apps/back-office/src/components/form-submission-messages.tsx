/**
 * Composant: FormSubmissionMessages
 * Affichage et gestion des messages liés à un formulaire de contact
 *
 * Fonctionnalités:
 * - Affichage chronologique des messages
 * - Distinction visuelle notes internes vs emails
 * - Ajout de nouvelles notes internes
 * - Envoi de réponses par email
 *
 * @module components/form-submission-messages
 */

'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { ButtonUnified } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { useFormMessages } from '@/hooks/use-form-messages';

export interface FormSubmissionMessagesProps {
  submissionId: string;
  contactEmail: string;
  contactName: string;
}

export function FormSubmissionMessages({
  submissionId,
  contactEmail,
  contactName,
}: FormSubmissionMessagesProps) {
  const { messages, loading, error, addMessage } =
    useFormMessages(submissionId);

  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Soumettre un nouveau message
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      setSendError('Le message ne peut pas être vide');
      return;
    }

    setSending(true);
    setSendError(null);
    setSuccessMessage(null);

    try {
      const success = await addMessage(newMessage, isInternal, !isInternal);

      if (success) {
        setNewMessage('');
        setSuccessMessage(
          isInternal
            ? 'Note interne ajoutée avec succès'
            : 'Message envoyé par email avec succès'
        );
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setSendError("Erreur lors de l'envoi du message");
      }
    } catch (err) {
      console.error('[FormSubmissionMessages] Error submitting message:', err);
      setSendError("Erreur inattendue lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div
        className="border rounded-lg flex items-center justify-center"
        style={{
          borderColor: colors.neutral[200],
          padding: spacing[8],
        }}
      >
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: colors.primary[600] }}
        />
        <span className="ml-2" style={{ color: colors.text.muted }}>
          Chargement des messages...
        </span>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: colors.neutral[200],
        padding: spacing[4],
      }}
    >
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text.DEFAULT }}
      >
        Historique des échanges
      </h3>

      {error && (
        <div
          className="mb-4 p-3 rounded flex items-start gap-2"
          style={{ backgroundColor: colors.danger[50] }}
        >
          <AlertCircle
            className="h-5 w-5 flex-shrink-0"
            style={{ color: colors.danger[600] }}
          />
          <p className="text-sm" style={{ color: colors.danger[700] }}>
            {error}
          </p>
        </div>
      )}

      {/* Liste des messages */}
      {messages.length === 0 ? (
        <div
          className="text-center py-8"
          style={{
            color: colors.text.muted,
            backgroundColor: colors.neutral[50],
            borderRadius: spacing[2],
          }}
        >
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun message pour le moment</p>
          <p className="text-xs mt-1">
            Ajoutez une note interne ou envoyez un email au client
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'p-3 rounded',
                msg.is_internal
                  ? 'bg-gray-50 border border-gray-200'
                  : 'bg-blue-50 border border-blue-200'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {msg.is_internal ? (
                    <Lock
                      className="h-4 w-4"
                      style={{ color: colors.text.muted }}
                    />
                  ) : (
                    <Mail
                      className="h-4 w-4"
                      style={{ color: colors.primary[600] }}
                    />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.text.DEFAULT }}
                  >
                    {msg.is_internal ? 'Note interne' : 'Email envoyé'}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: colors.text.muted }}
                  >
                    par {msg.user?.full_name || 'Utilisateur'}
                  </span>
                </div>
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: colors.text.DEFAULT }}
              >
                {msg.message}
              </p>
              {msg.email_id && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Email envoyé avec succès (ID: {msg.email_id.substring(0, 8)}
                  ...)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire ajout message */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {sendError && (
          <div
            className="p-3 rounded flex items-start gap-2"
            style={{ backgroundColor: colors.danger[50] }}
          >
            <AlertCircle
              className="h-5 w-5 flex-shrink-0"
              style={{ color: colors.danger[600] }}
            />
            <p className="text-sm" style={{ color: colors.danger[700] }}>
              {sendError}
            </p>
          </div>
        )}

        {successMessage && (
          <div
            className="p-3 rounded flex items-start gap-2"
            style={{ backgroundColor: colors.success[50] }}
          >
            <CheckCircle
              className="h-5 w-5 flex-shrink-0"
              style={{ color: colors.success[600] }}
            />
            <p className="text-sm" style={{ color: colors.success[700] }}>
              {successMessage}
            </p>
          </div>
        )}

        <div>
          <label
            className="text-sm font-medium mb-2 block"
            style={{ color: colors.text.DEFAULT }}
          >
            Nouveau message
          </label>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={4}
            className="w-full border rounded p-2 text-sm"
            style={{
              borderColor: colors.neutral[300],
              color: colors.text.DEFAULT,
            }}
            placeholder={
              isInternal
                ? "Rédigez une note interne (visible uniquement par l'équipe)..."
                : `Rédigez votre réponse à ${contactName} (${contactEmail})...`
            }
            disabled={sending}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={e => setIsInternal(e.target.checked)}
              disabled={sending}
              className="cursor-pointer"
            />
            <span className="text-sm" style={{ color: colors.text.DEFAULT }}>
              Note interne (non envoyée par email)
            </span>
          </label>
        </div>

        <ButtonUnified
          type="submit"
          disabled={!newMessage.trim() || sending}
          variant="default"
          className="w-full sm:w-auto"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Envoi en cours...
            </>
          ) : isInternal ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Ajouter note interne
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer par email
            </>
          )}
        </ButtonUnified>
      </form>
    </div>
  );
}

// Icon MessageSquare (fallback si pas dans lucide-react)
function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
