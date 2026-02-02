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

export interface FormMessage {
  id: string;
  submission_id: string;
  message: string;
  is_internal: boolean;
  sent_via: 'email' | 'internal' | 'other';
  email_id: string | null;
  created_at: string;
  created_by: string | null;
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('form_submission_messages' as any)
        .select(
          `
          id,
          submission_id,
          message,
          is_internal,
          sent_via,
          email_id,
          created_at,
          created_by,
          user:created_by(id, full_name, email)
        `
        )
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[useFormMessages] Error loading messages:', fetchError);
        setError('Erreur lors du chargement des messages');
        return;
      }

      setMessages((data as unknown as FormMessage[]) ?? []);
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
          const errorData = await response.json();
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
