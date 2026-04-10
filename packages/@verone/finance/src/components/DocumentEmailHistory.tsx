'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import type { DocumentEmail } from '../hooks/use-document-emails';

interface DocumentEmailHistoryProps {
  emails: DocumentEmail[];
  loading: boolean;
}

export function DocumentEmailHistory({
  emails,
  loading,
}: DocumentEmailHistoryProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            Historique des envois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            Historique des envois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun email envoye pour ce document
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          Historique des envois ({emails.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {emails.map(email => (
          <div
            key={email.id}
            className="flex items-start gap-3 rounded border border-gray-100 px-3 py-2"
          >
            {email.status === 'sent' ? (
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  {email.recipient_email}
                </p>
                <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {new Date(email.sent_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">{email.subject}</p>
              {email.attachments.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {email.attachments.map(a => a.filename).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
