'use client';

import { Badge, Card, CardContent } from '@verone/ui';
import { CheckCircle2, Clock, Mail, XCircle } from 'lucide-react';

import type { InfoRequest } from './types';

interface InfoRequestsCardProps {
  infoRequests: InfoRequest[];
}

export function InfoRequestsCard({ infoRequests }: InfoRequestsCardProps) {
  if (infoRequests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-indigo-600" />
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Demandes d&apos;infos
          </p>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {infoRequests.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {[...infoRequests]
            .sort(
              (a, b) =>
                new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            )
            .map(req => {
              const isPending = !req.completed_at && !req.cancelled_at;
              const isCompleted = !!req.completed_at;
              const isCancelled = !!req.cancelled_at;

              return (
                <div
                  key={req.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                    isPending
                      ? 'border-yellow-200 bg-yellow-50'
                      : isCompleted
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                  }`}
                >
                  {isPending && (
                    <Clock className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  {isCancelled && (
                    <XCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {req.recipient_email}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {req.recipient_type === 'requester'
                          ? 'Demandeur'
                          : 'Proprietaire'}
                      </Badge>
                    </div>
                    <div className="text-gray-500 mt-0.5">
                      {new Date(req.sent_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {isCompleted && req.completed_at && (
                        <span className="text-green-700 ml-1">
                          — Complete{' '}
                          {new Date(req.completed_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'short',
                            }
                          )}
                        </span>
                      )}
                      {isCancelled && req.cancelled_reason && (
                        <span className="text-red-700 ml-1">
                          — {req.cancelled_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
