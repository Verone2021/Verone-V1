/**
 * Hook: useFormMessages
 * Gestion des messages liés à un formulaire de contact
 *
 * Permet de:
 * - Récupérer les messages d'un formulaire
 * - Ajouter des notes internes
 * - Envoyer des réponses par email
 *
 * @module hooks/use-form-messages
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@verone/utils/supabase/client';

interface ApiErrorResponse {
  error?: string;
}

/**
 * FormMessage interface matching form_submission_messages table schema
 */
export interface FormMessage {
  id: string;
  form_submission_id: string;
  message_body: string;
  message_type: string | null;
  author_type: string;
  author_name: string | null;
  author_user_id: string | null;
  sent_via: string | null;
  email_id: string | null;
  email_sent_at: string | null;
  created_at: string | null;
}

export interface UseFormMessagesReturn {
  messages: FormMessage[];
  loading: boolean;
  error: string | null;
  addMessage: (
    message: string,
    isInternal: boolean,
    sendEmail: boolean
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour gérer les messages d'un formulaire
 */
export function useFormMessages(submissionId: string): UseFormMessagesReturn {
  const [messages, setMessages] = useState<FormMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les messages depuis Supabase
   */
  const loadMessages = useCallback(async () => {
    if (!submissionId) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('form_submission_messages')
        .select(
          `
          id,
          form_submission_id,
          message_body,
          message_type,
          author_type,
          author_name,
          author_user_id,
          sent_via,
          email_id,
          email_sent_at,
          created_at
        `
        )
        .eq('form_submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[useFormMessages] Error loading messages:', fetchError);
        setError('Erreur lors du chargement des messages');
        return;
      }

      setMessages((data ?? []) as FormMessage[]);
    } catch (err) {
      console.error('[useFormMessages] Unexpected error:', err);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  /**
   * Ajouter un message (note interne ou email)
   */
  const addMessage = useCallback(
    async (
      message: string,
      isInternal: boolean,
      sendEmail: boolean
    ): Promise<boolean> => {
      if (!message.trim()) {
        setError('Le message ne peut pas être vide');
        return false;
      }

      try {
        setError(null);

        // Appeler l'API route pour ajouter le message
        const response = await fetch(
          `/api/form-submissions/${submissionId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message.trim(),
              isInternal,
              sendEmail: !isInternal && sendEmail, // Envoyer email uniquement si pas une note interne
            }),
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiErrorResponse;
          throw new Error(
            errorData.error ?? "Erreur lors de l'ajout du message"
          );
        }

        // Recharger les messages pour afficher le nouveau
        await loadMessages();
        return true;
      } catch (err) {
        console.error('[useFormMessages] Error adding message:', err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'ajout du message"
        );
        return false;
      }
    },
    [submissionId, loadMessages]
  );

  /**
   * Rafraîchir les messages
   */
  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Charger les messages au montage et quand submissionId change
  useEffect(() => {
    void loadMessages().catch(error => {
      console.error('[useFormMessages] useEffect loadMessages failed:', error);
    });
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    addMessage,
    refresh,
  };
}
