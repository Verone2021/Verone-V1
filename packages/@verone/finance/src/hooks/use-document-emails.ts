'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface DocumentEmail {
  id: string;
  document_type: string;
  document_id: string;
  document_number: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  attachments: Array<{ filename: string; type: string }>;
  sent_at: string;
  created_at: string;
}

interface DocumentEmailRow {
  id: string;
  document_type: string;
  document_id: string;
  document_number: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  attachments: unknown;
  sent_at: string;
  created_at: string;
}

export function useDocumentEmails(documentId: string | undefined) {
  const [emails, setEmails] = useState<DocumentEmail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);

    try {
      const supabase = createClient();
      // Table created after types were generated — use schema-qualified query
      const { data, error } = await (
        supabase as unknown as {
          from: (table: string) => {
            select: (cols: string) => {
              eq: (
                col: string,
                val: string
              ) => {
                order: (
                  col: string,
                  opts: { ascending: boolean }
                ) => Promise<{
                  data: DocumentEmailRow[] | null;
                  error: { message: string } | null;
                }>;
              };
            };
          };
        }
      )
        .from('document_emails')
        .select(
          'id, document_type, document_id, document_number, recipient_email, subject, status, attachments, sent_at, created_at'
        )
        .eq('document_id', documentId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('[useDocumentEmails] fetch error:', error);
        return;
      }

      setEmails(
        (data ?? []).map(row => ({
          ...row,
          attachments:
            typeof row.attachments === 'string'
              ? (JSON.parse(row.attachments) as Array<{
                  filename: string;
                  type: string;
                }>)
              : ((row.attachments as Array<{
                  filename: string;
                  type: string;
                }>) ?? []),
        }))
      );
    } catch (err) {
      console.error('[useDocumentEmails] error:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void fetchEmails().catch((err: unknown) => {
      console.error('[useDocumentEmails] auto-fetch error:', err);
    });
  }, [fetchEmails]);

  return { emails, loading, fetchEmails };
}
